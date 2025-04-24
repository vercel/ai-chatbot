import type {
  UIMessage,
  CoreMessage,
  LanguageModelV1CallOptions,
  LanguageModelV1Prompt,
} from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/queries';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
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
import { N8nLanguageModel } from '@/lib/ai/n8n-model';
import { AISDKExporter } from 'langsmith/vercel';
import { revalidateTag } from 'next/cache';

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

    console.log(
      '[API /api/chat] Received messages:',
      JSON.stringify(messages, null, 2),
    );

    // --- CLERK AUTH & PROFILE LOOKUP ---
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error('[API /api/chat] Unauthorized - No Clerk User ID found');
      return new Response('Unauthorized', { status: 401 });
    }
    const profile = await db.query.userProfiles.findFirst({
      columns: { id: true },
      where: eq(schema.userProfiles.clerkId, clerkUserId),
    });
    const userProfileId: string | undefined = profile?.id;
    if (!userProfileId) {
      console.error(`Could not find user profile for Clerk ID: ${clerkUserId}`);
      return new Response('User profile not found', { status: 500 });
    }
    const userId = userProfileId; // Use the profile UUID as userId internally
    // --- END CLERK AUTH ---

    const finalChatId = id;

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // --- CHAT CREATION/CHECK LOGIC (Adapted from Original) ---
    const isNewChatAttempt =
      messages.length === 1 && messages[0].role === 'user';

    if (isNewChatAttempt) {
      console.log(`Attempting to save as new chat (ID: ${finalChatId})...`);
      let newChatTitle = '';

      // Generate title only for new chats
      if (documentId) {
        // Use Drizzle query instead of Supabase client
        const documentData = await db.query.document.findFirst({
          columns: { title: true },
          where: and(
            eq(schema.document.id, documentId),
            eq(schema.document.userId, userId), // Use profile UUID
          ),
        });

        if (!documentData) {
          console.error(
            `Document not found or permission denied for documentId: ${documentId} and userProfileId: ${userId}`,
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

      // Attempt to save the new chat record (using existing helper)
      try {
        await saveChat({
          id: finalChatId,
          userId: userId, // Use profile UUID
          title: newChatTitle,
        });
        // Revalidate chat-specific cache and user history cache
        revalidateTag(`chat-${finalChatId}`);
        revalidateTag(`history-${userId}`);
        console.log(
          `Saved new chat with ID: ${finalChatId} and Title: "${newChatTitle}"`,
        );

        // Link document if needed (using Drizzle)
        if (documentId) {
          console.log(
            `Attempting to link document ${documentId} to chat ${finalChatId}`,
          );
          try {
            await db
              .update(schema.document)
              .set({ chatId: finalChatId })
              .where(
                and(
                  eq(schema.document.id, documentId),
                  eq(schema.document.userId, userId), // Use profile UUID
                ),
              );
            console.log(
              `Successfully linked document ${documentId} to chat ${finalChatId}`,
            );
          } catch (updateError) {
            console.error(
              `Failed to update document ${documentId} with chat_id ${finalChatId}:`,
              updateError,
            );
            // Continue even if linking fails? Or return error?
          }
        }
      } catch (saveError: any) {
        // Handle duplicate key error gracefully (race condition)
        if (saveError.code === '23505') {
          // Assuming Drizzle throws similar error code
          console.warn(
            `Chat (ID: ${finalChatId}) already exists, likely due to race condition. Proceeding.`,
          );
          revalidateTag(`chat-${finalChatId}`);
        } else {
          console.error('Failed to save chat:', saveError);
          return new Response('Failed to save chat', { status: 500 });
        }
      }
    } else {
      // For existing chats, just verify ownership (using existing helper)
      console.log(
        `Verifying ownership for existing chat (ID: ${finalChatId})...`,
      );
      const chat = await getChatById({ id: finalChatId });
      if (!chat) {
        console.error(
          `Existing chat check failed: Chat (ID: ${finalChatId}) not found in DB.`,
        );
        return new Response('Chat not found', { status: 404 });
      }
      if (chat.userId !== userId) {
        // Use profile UUID for check
        console.warn(
          `Unauthorized attempt to access chat (ID: ${finalChatId}) by user ${userId}.`,
        );
        return new Response('Unauthorized', { status: 401 });
      }
      console.log(`Ownership verified for chat (ID: ${finalChatId}).`);
    }
    // --- END CHAT CREATION/CHECK LOGIC ---

    // Save the current user message (using existing helper)
    try {
      await saveMessages({
        messages: [
          {
            chatId: finalChatId,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts ?? [], // Ensure parts/attachments are handled
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });
      console.log(
        `Saved user message (ID: ${userMessage.id}) for chat ${finalChatId}`,
      );
    } catch (error: any) {
      if (error.code === '23503') {
        // Assuming Drizzle foreign key error code
        console.error(
          `Failed to save message: Chat (ID: ${finalChatId}) does not exist.`,
          error,
        );
        return new Response('Chat record not found for message', {
          status: 404,
        });
      } else {
        console.error(
          `Failed to save user message (ID: ${userMessage.id}) for chat ${finalChatId}:`,
          error,
        );
        return new Response('Failed to save message', { status: 500 });
      }
    }

    // ---- START N8N CHECK LOGS ----
    console.log(
      `[API Route] Checking model: selectedChatModel = "${selectedChatModel}"`,
    );
    const selectedModelInfo = chatModels.find(
      (m) => m.id === selectedChatModel,
    );
    console.log(`[API Route] Found selectedModelInfo:`, selectedModelInfo);
    console.log(
      `[API Route] Evaluating selectedModelInfo?.isN8n: ${selectedModelInfo?.isN8n}`,
    );
    // ---- END N8N CHECK LOGS ----

    // Check if selected model is an n8n assistant
    if (selectedModelInfo?.isN8n) {
      // ---- START INSIDE N8N IF LOG ----
      console.log(
        `[API Route] Entering N8n model block for model: ${selectedChatModel}`,
      );
      // ---- END INSIDE N8N IF LOG ----

      const webhookUrl = n8nWebhookUrls[selectedChatModel];
      if (!webhookUrl) {
        console.error(
          `Webhook URL for n8n assistant "${selectedChatModel}" is not configured.`,
        );
        return new Response('Assistant configuration error', { status: 500 });
      }

      // *** Instantiate the N8nLanguageModel ***
      const lastUserMessageId = userMessage?.id ?? null;
      const lastUserMessageCreatedAt = userMessage?.createdAt ?? null;

      if (!lastUserMessageId) {
        console.warn(
          '[API Route] Warning: lastUserMessageId is null before passing to N8nModel.',
        );
      }

      const n8nModel = new N8nLanguageModel({
        webhookUrl: webhookUrl,
        modelId: selectedChatModel,
        chatId: finalChatId,
        userId: userId, // Use profile UUID
        messageId: lastUserMessageId,
        datetime: lastUserMessageCreatedAt,
      });

      // *** USE createDataStreamResponse with streamText and the n8nModel (Restoring Original Logic) ***
      return createDataStreamResponse({
        execute: (dataStream) => {
          const result = streamText({
            model: n8nModel,
            // Ensure messages are filtered and asserted correctly
            messages: messages.filter(
              (m) => m.role !== 'data',
            ) as CoreMessage[],
            maxSteps: 5, // Keep original settings
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            onFinish: async ({ response }) => {
              console.log(
                '[API Route / N8n / onFinish] Reached onFinish handler.',
              ); // LOG: Entered handler
              if (userId) {
                console.log(
                  `[API Route / N8n / onFinish] User ID ${userId} present.`,
                ); // LOG: User ID check
                try {
                  console.log(
                    '[API Route / N8n / onFinish] Attempting to get trailing message ID.',
                  ); // LOG: Before getTrailingMessageId
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter(
                      (message) => message.role === 'assistant',
                    ),
                  });
                  console.log(
                    `[API Route / N8n / onFinish] Got assistantId: ${assistantId}`,
                  ); // LOG: After getTrailingMessageId
                  if (!assistantId) {
                    console.error(
                      '[API Route / N8n / onFinish] Error: No assistant message found after stream!',
                    );
                    throw new Error(
                      'No assistant message found after n8n stream!',
                    );
                  }
                  console.log(
                    '[API Route / N8n / onFinish] Attempting appendResponseMessages.',
                  ); // LOG: Before append
                  const [, assistantMessage] = appendResponseMessages({
                    messages: [userMessage],
                    responseMessages: response.messages,
                  });
                  console.log(
                    '[API Route / N8n / onFinish] Attempting saveMessages.',
                  ); // LOG: Before save
                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
                        chatId: finalChatId,
                        role: 'assistant', // Explicitly set role from previous fix
                        parts: assistantMessage.parts ?? [],
                        attachments:
                          assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });
                  console.log(
                    `[API Route / N8n / onFinish] SUCCESS: Saved final n8n message (ID: ${assistantId}) for chat ${finalChatId}`,
                  ); // LOG: Success
                } catch (saveError) {
                  // LOG: Failure
                  console.error(
                    '[API Route / N8n / onFinish] FAILURE: Failed to save n8n chat message:',
                    saveError,
                  );
                }
              } else {
                console.warn(
                  '[API Route / N8n / onFinish] User ID not found, cannot save message.',
                ); // LOG: No user ID
              }
            },
            experimental_telemetry: AISDKExporter.getSettings(),
          });

          console.log(
            `[API Route] Calling streamText for N8N chat ${finalChatId} with Langsmith telemetry enabled.`,
          );
          result.consumeStream();
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: false,
          });
        },
        onError: (error) => {
          console.error('Error in streamText with n8nModel:', error);
          return 'Oops, an error occurred communicating with the assistant!';
        },
      });
    }

    // STANDARD MODEL LOGIC (From Original, Adapted Tools)
    // Ensure this part remains consistent with the previous version
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages: messages.filter((m) => m.role !== 'data') as CoreMessage[], // Keep filter + assertion
          maxSteps: 5,
          experimental_activeTools: [
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
              userId: userId, // Pass profile UUID
              dataStream,
              chatId: finalChatId,
            }),
            updateDocument: updateDocument({ userId: userId, dataStream }), // Pass profile UUID
            requestSuggestions: requestSuggestions({
              userId: userId, // Pass profile UUID
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
                // Save message - will fix role type in next step
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: finalChatId,
                      role: 'assistant',
                      parts: assistantMessage.parts ?? [],
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (error) {
                console.error(
                  'Failed to save standard chat message after stream:',
                  error,
                );
              }
            }
          },
          experimental_telemetry: AISDKExporter.getSettings(),
        });

        console.log(
          `[API Route] Calling streamText for standard chat ${finalChatId} with Langsmith telemetry enabled.`,
        );
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
    console.error('Error in POST /api/chat:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

// Modify DELETE to use Clerk Auth and profile ID
export async function DELETE(request: Request) {
  // Get ID from body as per current working version, not searchParams
  const { id } = await request.json();

  if (!id) {
    return new Response('Missing chat ID', { status: 400 });
  }

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    console.error('[DELETE /api/chat] Unauthorized - No Clerk User ID found');
    return new Response('Unauthorized', { status: 401 });
  }
  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });
  const userId = profile?.id; // Profile UUID
  if (!userId) {
    console.error(
      `[DELETE /api/chat] User profile not found for Clerk ID: ${clerkUserId}`,
    );
    return new Response('User profile not found', { status: 500 });
  }
  // --- END CLERK AUTH ---

  try {
    const chat = await getChatById({ id: id }); // Use existing helper

    // If chat doesn't exist, it might have been deleted already. Return OK.
    if (!chat) {
      console.log(`[DELETE /api/chat] Chat ${id} not found, returning OK.`);
      return new Response('OK', { status: 200 });
    }

    // Verify ownership using the profile UUID
    if (chat.userId !== userId) {
      console.warn(
        `[DELETE /api/chat] Unauthorized attempt to delete chat ${id} by user ${userId}.`,
      );
      return new Response('Unauthorized', { status: 401 });
    }

    // Use existing helper to delete
    await deleteChatById({ id: id });
    revalidateTag(`chat-${id}`); // Keep revalidation
    console.log(`[DELETE /api/chat] Deleted chat ${id} by user ${userId}.`);
    return new Response('OK', { status: 200 }); // Return OK on success
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('Failed to delete chat', { status: 500 });
  }
}
