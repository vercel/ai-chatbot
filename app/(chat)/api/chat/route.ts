import type { UIMessage } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getUser,
  createUser,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { chatModels } from '@/lib/ai/models';

export const maxDuration = 60;

// Define n8n webhook URLs from environment variables
const n8nWebhookUrls: Record<string, string> = {
  'n8n-assistant':
    'https://n8n-naps.onrender.com/webhook/05af71c4-23a8-44fb-bfd6-3536345edbac',
  'n8n-assistant-1': process.env.N8N_ASSISTANT_1_WEBHOOK_URL || '',
  'n8n-assistant-2': process.env.N8N_ASSISTANT_2_WEBHOOK_URL || '',
};

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      documentId,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      documentId?: string;
    } = await request.json();

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = user.id;

    // --- BEGIN: Ensure user exists in our DB ---
    try {
      const dbUser = await getUser(user.email ?? ''); // Use email to check
      if (dbUser.length === 0 && user.email) {
        // User exists in Supabase Auth but not in our DB, create them
        await createUser(user.email, userId);
        console.log(`Created user ${userId} in local DB.`);
      }
    } catch (dbError) {
      console.error('Failed to check/create user in DB:', dbError);
      return new Response('Database error checking user', { status: 500 });
    }
    // --- END: Ensure user exists in our DB ---

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    const finalChatId = id;
    let finalTitle = '';

    if (!chat) {
      let newChatTitle = '';

      if (documentId) {
        const { data: documentData, error: docError } = await supabase
          .from('Document')
          .select('title')
          .eq('id', documentId)
          .eq('userId', userId)
          .maybeSingle();

        if (docError) {
          console.error('Error fetching document title:', docError);
          return new Response('Error fetching document details', {
            status: 500,
          });
        }
        if (!documentData) {
          console.error(
            `Document not found or permission denied for documentId: ${documentId}`,
          );
          return new Response('Document not found or access denied', {
            status: 404,
          });
        }
        newChatTitle = documentData.title;
        console.log(`Using document title for new chat: "${newChatTitle}"`);
      } else {
        newChatTitle = await generateTitleFromUserMessage({
          message: userMessage,
        });
        console.log(`Generated title for new chat: "${newChatTitle}"`);
      }

      finalTitle = newChatTitle;

      try {
        await saveChat({ id: finalChatId, userId: userId, title: finalTitle });
        console.log(
          `Saved new chat with ID: ${finalChatId} and Title: "${finalTitle}"`,
        );

        if (documentId) {
          console.log(
            `Attempting to link document ${documentId} to chat ${finalChatId}`,
          );
          const { error: updateError } = await supabase
            .from('Document')
            .update({ chat_id: finalChatId })
            .eq('id', documentId)
            .eq('userId', userId);

          if (updateError) {
            console.error(
              `Failed to update document ${documentId} with chat_id ${finalChatId}:`,
              updateError,
            );
          } else {
            console.log(
              `Successfully linked document ${documentId} to chat ${finalChatId}`,
            );
          }
        }
      } catch (saveError) {
        console.error('Failed to save chat:', saveError);
        return new Response('Failed to save chat', { status: 500 });
      }
    } else {
      if (chat.userId !== userId) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: finalChatId,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    // Check if selected model is an n8n assistant
    const selectedModelInfo = chatModels.find(
      (m) => m.id === selectedChatModel,
    );
    if (selectedModelInfo?.isN8n) {
      const webhookUrl = n8nWebhookUrls[selectedChatModel];
      if (!webhookUrl) {
        console.error(
          `Webhook URL for n8n assistant "${selectedChatModel}" is not configured.`,
        );
        return new Response('Assistant configuration error', { status: 500 });
      }

      try {
        console.log(
          `Routing to n8n webhook: ${webhookUrl} for model: ${selectedChatModel}`,
        );
        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if your webhook requires them
          },
          body: JSON.stringify({
            chatId: finalChatId,
            userId: userId,
            userMessage: userMessage,
            history: messages.slice(0, -1), // Previous messages
          }),
        });

        if (!n8nResponse.ok) {
          const errorBody = await n8nResponse.text();
          console.error(
            `n8n webhook call failed (${n8nResponse.status}): ${errorBody}`,
          );
          throw new Error(
            `n8n assistant communication failed (${n8nResponse.status})`,
          );
        }

        // Parse n8n response
        const n8nData = await n8nResponse.json();
        console.log('n8n response data:', JSON.stringify(n8nData));

        // Handle both array and direct object response formats
        const assistantReplyText =
          // If response is an array with responseMessage in first item
          Array.isArray(n8nData) &&
          n8nData.length > 0 &&
          n8nData[0].responseMessage
            ? n8nData[0].responseMessage
            : // If response is a direct object with responseMessage
              n8nData && n8nData.responseMessage
              ? n8nData.responseMessage
              : 'Received response from assistant.';

        console.log('Using assistant reply text:', assistantReplyText);

        // Create and save assistant message
        const assistantId = generateUUID();
        const assistantMessage = {
          id: assistantId,
          role: 'assistant' as const,
          parts: [{ type: 'text', value: assistantReplyText }],
          createdAt: new Date(),
        };

        await saveMessages({
          messages: [
            {
              id: assistantId,
              chatId: finalChatId,
              role: assistantMessage.role,
              parts: assistantMessage.parts,
              attachments: [],
              createdAt: assistantMessage.createdAt,
            },
          ],
        });

        // Return response in a format compatible with the frontend expectations
        // Creating a simple stream with just the assistant message
        const stream = new ReadableStream({
          start(controller) {
            // Format to match the Vercel AI SDK streaming format
            // The format is "event: message\ndata: {\"type\":\"message\",\"message\":{...}}\n\n"
            controller.enqueue(
              `event: message\ndata: ${JSON.stringify({
                type: 'message',
                message: assistantMessage,
              })}\n\n`,
            );
            controller.close();
          },
        });

        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        });
      } catch (n8nError: any) {
        console.error('Error calling n8n webhook:', n8nError);
        return new Response(
          `Failed to communicate with the assistant: ${n8nError.message}`,
          { status: 500 },
        );
      }
    }

    // Original code for standard models
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({
              user,
              dataStream,
              chatId: finalChatId,
            }),
            updateDocument: updateDocument({ user, dataStream }),
            requestSuggestions: requestSuggestions({
              user,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (userId) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: finalChatId,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error('Error in POST /api/chat:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500, // Return 500 for internal server errors
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = user.id;

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
