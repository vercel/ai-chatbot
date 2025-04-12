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

export const maxDuration = 60;

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

    let finalChatId = id;
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
