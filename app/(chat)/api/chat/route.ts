import type { UIMessage, CoreMessage, Message } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  appendClientMessage,
  convertToCoreMessages,
} from 'ai';
import { auth } from '@clerk/nextjs/server';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  db,
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getMessagesByChatId,
  type NewDBMessage,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { myProvider } from '@/lib/ai/providers';
import { chatModels } from '@/lib/ai/models';
import { AISDKExporter } from 'langsmith/vercel';
import { revalidateTag } from 'next/cache';
import { getGoogleOAuthToken } from '@/app/actions/get-google-token';
import { assembleTools } from '@/lib/ai/tools/tool-list';
import MemoryClient from 'mem0ai';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { z } from 'zod';

// Add type declaration at the top of the file
declare global {
  var activeStreams:
    | Map<string, { dataStream: any; heartbeatInterval: NodeJS.Timeout }>
    | undefined;
}

const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY || '' });

export const maxDuration = 300;

// Define n8n webhook URLs from environment variables
const n8nWebhookUrls: Record<string, string> = {
  'n8n-assistant':
    process.env.N8N_ASSISTANT_WEBHOOK_URL ||
    'https://n8n-naps.onrender.com/webhook/05af71c4-23a8-44fb-bfd6-3536345edbac',
  'n8n-assistant-1': process.env.N8N_ASSISTANT_1_WEBHOOK_URL || '',
  'n8n-assistant-2': process.env.N8N_ASSISTANT_2_WEBHOOK_URL || '',
};

// +++++ HELPER FUNCTIONS FOR MESSAGE MAPPING +++++
function mapDBMessagesToUIMessages(
  dbMessages: schema.DBMessage[],
): UIMessage[] {
  return dbMessages
    .map((dbMsg) => {
      let mappedParts: UIMessage['parts'] = [];
      let contentFallback = '';

      if (dbMsg.parts != null) {
        if (typeof dbMsg.parts === 'string') {
          mappedParts = [{ type: 'text', text: dbMsg.parts }];
          contentFallback = dbMsg.parts;
        } else if (Array.isArray(dbMsg.parts)) {
          mappedParts = (dbMsg.parts as any[])
            .filter((p) => p && typeof p.type === 'string')
            .map((p) => ({ ...p })); // Shallow copy each part
          if (mappedParts.length === 0 && dbMsg.parts.length > 0) {
            // If filter removed all, but parts existed
            const stringified = JSON.stringify(dbMsg.parts);
            mappedParts = [{ type: 'text', text: stringified }];
            contentFallback = stringified;
          } else {
            contentFallback = mappedParts
              .filter(
                (p) => p.type === 'text' && typeof (p as any).text === 'string',
              )
              .map((p) => (p as any).text)
              .join('\n');
          }
        } else if (typeof dbMsg.parts === 'object') {
          const potentialText =
            (dbMsg.parts as any).content || (dbMsg.parts as any).text;
          if (typeof potentialText === 'string') {
            mappedParts = [{ type: 'text', text: potentialText }];
            contentFallback = potentialText;
          } else {
            const stringifiedParts = JSON.stringify(dbMsg.parts);
            mappedParts = [{ type: 'text', text: stringifiedParts }];
            contentFallback = stringifiedParts;
          }
        } else {
          const stringifiedParts = String(dbMsg.parts);
          mappedParts = [{ type: 'text', text: stringifiedParts }];
          contentFallback = stringifiedParts;
        }
      }

      if (mappedParts.length === 0) {
        mappedParts = [{ type: 'text', text: '' }]; // Default to empty text part if nothing else
      }

      return {
        id: dbMsg.id,
        role: dbMsg.role as UIMessage['role'],
        parts: mappedParts,
        content: contentFallback,
        experimental_attachments:
          (dbMsg.attachments as UIMessage['experimental_attachments']) ?? [],
        createdAt: dbMsg.createdAt ? new Date(dbMsg.createdAt) : new Date(),
      };
    })
    .filter((msg) => ['user', 'assistant', 'system'].includes(msg.role));
}

function mapIncomingMessageToUIMessage(
  incomingMsg: PostRequestBody['message'],
): UIMessage {
  const attachments = incomingMsg.experimental_attachments ?? [];
  // Ensure parts is an array, even if client somehow sends non-array (schema should prevent this)
  const partsAsArray = Array.isArray(incomingMsg.parts)
    ? incomingMsg.parts
    : [{ type: 'text', text: incomingMsg.content }];

  return {
    id: incomingMsg.id,
    role: incomingMsg.role, // 'user'
    content: incomingMsg.content,
    parts: partsAsArray as UIMessage['parts'],
    experimental_attachments:
      attachments as UIMessage['experimental_attachments'],
    createdAt: incomingMsg.createdAt
      ? new Date(incomingMsg.createdAt)
      : new Date(),
  };
}
// +++++ END HELPER FUNCTIONS +++++

export async function POST(request: Request) {
  console.log('[SERVER_API_CHAT_DEBUG] POST handler initiated.');
  try {
    // VERCEL_TEMPLATE_ALIGNMENT: Parse request using Zod schema
    let parsedRequestBody: PostRequestBody;
    try {
      const json = await request.json();
      console.log(
        '[SERVER_API_CHAT_DEBUG] Raw request.json():',
        JSON.stringify(json, null, 2),
      );
      parsedRequestBody = postRequestBodySchema.parse(json);
    } catch (error) {
      console.error('[API /api/chat] Invalid request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: (error as z.ZodError).issues,
        }),
        { status: 400 },
      );
    }

    console.log(
      '[SERVER_API_CHAT_DEBUG] Parsed requestBody (postRequestBodySchema):',
      JSON.stringify(parsedRequestBody, null, 2),
    );

    const {
      id: chatId,
      message: incomingUserMessageFromClient,
      selectedChatModel,
      selectedVisibilityType,
    } = parsedRequestBody;
    console.log(
      '[SERVER_API_CHAT_DEBUG] Destructured chatId:',
      chatId,
      ' incomingUserMessageFromClient.id:',
      incomingUserMessageFromClient.id,
    );
    // --- END VERCEL_TEMPLATE_ALIGNMENT ---

    // --- Process messages for logging: Truncate base64 image data --- START
    // (Using incomingUserMessageFromClient instead of messages array)
    const loggableMessage = JSON.parse(
      JSON.stringify(incomingUserMessageFromClient),
    );
    if (Array.isArray(loggableMessage.parts)) {
      loggableMessage.parts = loggableMessage.parts.map((part: any) => {
        if (
          typeof part.content === 'string' && // Assuming part has content, adjust if structure is {type, text}
          part.content.startsWith('data:image/')
        ) {
          return { ...part, content: '[base64 image data truncated]' };
        }
        // For parts like {type: 'text', text: '...'}
        if (
          typeof part.text === 'string' &&
          part.text.startsWith('data:image/')
        ) {
          return { ...part, text: '[base64 image data truncated]' };
        }
        return part;
      });
    }
    if (Array.isArray(loggableMessage.experimental_attachments)) {
      loggableMessage.experimental_attachments =
        loggableMessage.experimental_attachments.map((attachment: any) => {
          if (
            typeof attachment.content === 'string' &&
            attachment.content.startsWith('data:image/')
          ) {
            return { ...attachment, content: '[base64 image data truncated]' };
          }
          return attachment;
        });
    }
    // --- END Process messages for logging ---
    console.log(
      '[API /api/chat] Received single message (images truncated):',
      JSON.stringify(loggableMessage, null, 2),
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
    const userId = userProfileId;
    // --- END CLERK AUTH ---

    // --- FETCH GOOGLE OAUTH TOKEN (Added) ---
    console.log(
      `[SERVER_API_CHAT_DEBUG] Attempting to fetch Google OAuth token for user: ${userId}`,
    );
    const tokenResult = await getGoogleOAuthToken();
    if (tokenResult.error) {
      // Log error but don't necessarily block the chat flow unless the token is strictly required
      console.warn(
        `[SERVER_API_CHAT_DEBUG] Failed to get Google OAuth token for user ${userId}: ${tokenResult.error}`,
      );
      // If the token IS required for the next step, you might return an error here:
      // return new Response(`Failed to get required Google token: ${tokenResult.error}`, { status: 500 });
    } else if (tokenResult.token) {
      console.log(
        `[SERVER_API_CHAT_DEBUG] Successfully fetched Google OAuth token for user ${userId}.`,
      );
      // You can now use tokenResult.token if needed for tools/AI calls later in this function
      // Example: pass it to streamText options or tool functions
    } else {
      console.warn(
        `[SERVER_API_CHAT_DEBUG] Google OAuth token fetch for user ${userId} completed but no token was returned.`,
      );
    }
    // --- END FETCH GOOGLE OAUTH TOKEN ---

    // Map the single incoming client message to UIMessage format
    const incomingUserUIMessage = mapIncomingMessageToUIMessage(
      incomingUserMessageFromClient,
    );

    // Fetch previous messages from DB
    const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });
    // Map DB messages to UIMessage format
    const uiPreviousMessages = mapDBMessagesToUIMessages(
      previousMessagesFromDB,
    );

    // --- CHAT CREATION/CHECK LOGIC (Adapted for single incoming message) ---
    console.log(
      '[SERVER_API_CHAT_DEBUG] Checking for existing chat with getChatById, chatId:',
      chatId,
    );
    const existingChat = await getChatById({ id: chatId });
    console.log(
      '[SERVER_API_CHAT_DEBUG] getChatById result:',
      existingChat
        ? `Found chat (userId: ${existingChat.userId})`
        : 'Chat not found.',
    );
    const isNewChat = !existingChat;

    if (isNewChat) {
      console.log(
        `[SERVER_API_CHAT_DEBUG] Attempting to save as new chat (ID: ${chatId})...`,
      );
      let newChatTitle = '';

      newChatTitle = await generateTitleFromUserMessage({
        message: incomingUserMessageFromClient as Message,
      });
      console.log(
        `[SERVER_API_CHAT_DEBUG] Generated title for new chat: "${newChatTitle}"`,
      );

      try {
        console.log(
          '[SERVER_API_CHAT_DEBUG] Calling saveChat for new chat, ID:',
          chatId,
          ' Title:',
          newChatTitle,
          ' Visibility:',
          selectedVisibilityType,
        );
        await saveChat({
          id: chatId,
          userId: userId,
          title: newChatTitle,
          visibility: selectedVisibilityType,
        });
        revalidateTag(`chat-${chatId}`);
        revalidateTag(`history-${userId}`);
        console.log(
          `[SERVER_API_CHAT_DEBUG] CALLED revalidateTag for chat-${chatId}`,
        );
        console.log(
          `[SERVER_API_CHAT_DEBUG] Saved new chat with ID: ${chatId} and Title: "${newChatTitle}"`,
        );
      } catch (saveError: any) {
        if (saveError.code === '23505') {
          console.warn(
            `[SERVER_API_CHAT_DEBUG] Chat (ID: ${chatId}) already exists, likely due to race condition. Proceeding.`,
          );
          revalidateTag(`chat-${chatId}`);
          console.log(
            `[SERVER_API_CHAT_DEBUG] CALLED revalidateTag for chat-${chatId} (in race condition handler)`,
          );
        } else {
          console.error(
            '[SERVER_API_CHAT_DEBUG] Failed to save chat:',
            saveError,
          );
          return new Response('Failed to save chat', { status: 500 });
        }
      }
    } else {
      console.log(
        `[SERVER_API_CHAT_DEBUG] Verifying ownership for existing chat (ID: ${chatId})...`,
      );
      if (existingChat.userId !== userId) {
        console.warn(
          `[SERVER_API_CHAT_DEBUG] Unauthorized attempt to access chat (ID: ${chatId}) by user ${userId}.`,
        );
        return new Response('Unauthorized', { status: 401 });
      }
      console.log(
        `[SERVER_API_CHAT_DEBUG] Ownership verified for chat (ID: ${chatId}).`,
      );
      if (existingChat.visibility !== selectedVisibilityType) {
        await db
          .update(schema.Chat)
          .set({ visibility: selectedVisibilityType })
          .where(eq(schema.Chat.id, chatId));
        revalidateTag(`chat-${chatId}`);
        console.log(
          `[SERVER_API_CHAT_DEBUG] Updated chat ${chatId} visibility to ${selectedVisibilityType}`,
        );
      }
    }
    // --- END CHAT CREATION/CHECK LOGIC ---

    // Save the current user message
    try {
      const userMessageToSave: NewDBMessage = {
        chatId: chatId,
        id: incomingUserMessageFromClient.id,
        role: incomingUserMessageFromClient.role as NewDBMessage['role'],
        parts: incomingUserMessageFromClient.parts,
        attachments:
          incomingUserMessageFromClient.experimental_attachments ?? [],
        createdAt: incomingUserMessageFromClient.createdAt || new Date(),
      };
      await saveMessages({ messages: [userMessageToSave] });
      console.log(
        `[SERVER_API_CHAT_DEBUG] Saved user message (ID: ${incomingUserMessageFromClient.id}) for chat ${chatId}`,
      );
    } catch (error: any) {
      if (error.code === '23503') {
        console.error(
          `[SERVER_API_CHAT_DEBUG] Failed to save message: Chat (ID: ${chatId}) does not exist.`,
          error,
        );
        return new Response('Chat record not found for message', {
          status: 404,
        });
      } else {
        console.error(
          `[SERVER_API_CHAT_DEBUG] Failed to save user message (ID: ${incomingUserMessageFromClient.id}) for chat ${chatId}:`,
          error,
        );
        return new Response('Failed to save message', { status: 500 });
      }
    }

    // ---- N8N Model Handling ----
    console.log(
      `[SERVER_API_CHAT_DEBUG] Checking model: selectedChatModel = "${selectedChatModel}"`,
    );
    const selectedModelInfo = chatModels.find(
      (m) => m.id === selectedChatModel,
    );
    console.log(
      `[SERVER_API_CHAT_DEBUG] Evaluating selectedModelInfo?.isN8n: ${selectedModelInfo?.isN8n}`,
    );

    if (selectedModelInfo?.isN8n) {
      console.log(
        `[SERVER_API_CHAT_DEBUG] Triggering n8n workflow for chat ${chatId}`,
      );
      const webhookUrl = n8nWebhookUrls[selectedChatModel];
      if (!webhookUrl) {
        console.error(
          `[SERVER_API_CHAT_DEBUG] Webhook URL for n8n assistant "${selectedChatModel}" is not configured.`,
        );
        return new Response('Assistant configuration error', { status: 500 });
      }

      const n8nPayload = {
        chatId: chatId,
        userId: userId,
        messageId: incomingUserMessageFromClient.id,
        userMessage: incomingUserMessageFromClient.content,
        userMessageParts: incomingUserMessageFromClient.parts,
        userMessageDatetime: incomingUserMessageFromClient.createdAt,
        history: [],
        ...(tokenResult.token && { google_token: tokenResult.token }),
      };

      console.log(
        '[SERVER_API_CHAT_DEBUG] n8n payload:',
        JSON.stringify(n8nPayload, null, 2),
      );
      console.log(
        '[SERVER_API_CHAT_DEBUG] N8N Payload - history field content:',
        JSON.stringify(n8nPayload.history, null, 2),
      );
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.N8N_WEBHOOK_SECRET_KEY && {
            Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET_KEY}`,
          }),
        },
        body: JSON.stringify(n8nPayload),
      })
        .then((resp) =>
          console.log(
            '[SERVER_API_CHAT_DEBUG] n8n webhook responded with status',
            resp.status,
          ),
        )
        .catch((error) =>
          console.error(
            '[SERVER_API_CHAT_DEBUG] Error triggering n8n webhook:',
            error,
          ),
        );
      return new Response(null, { status: 204 }); // Return No Content
    } else {
      // ---- STANDARD MODEL LOGIC (Leverage Vercel AI SDK) ----
      console.log(
        '[SERVER_API_CHAT_DEBUG] Fetching previousMessagesFromDB for standard model, chatId:',
        chatId,
      );
      const previousMessagesFromDB = await getMessagesByChatId({ id: chatId });
      console.log(
        '[SERVER_API_CHAT_DEBUG] previousMessagesFromDB fetched. Count:',
        previousMessagesFromDB.length,
        'Last few:',
        JSON.stringify(previousMessagesFromDB.slice(-3), null, 2),
      );

      // Minimal mapping to ensure UIMessage compatibility, especially the 'content' field
      const uiPreviousMessagesForAI: UIMessage[] = previousMessagesFromDB.map(
        (dbMsg) => {
          let contentStr = '';
          if (typeof dbMsg.parts === 'string') {
            contentStr = dbMsg.parts;
          } else if (Array.isArray(dbMsg.parts)) {
            contentStr = (dbMsg.parts as Array<any>)
              .filter(
                (p_1) => p_1.type === 'text' && typeof p_1.text === 'string',
              )
              .map((p_2) => p_2.text)
              .join('\n');
            if (!contentStr && dbMsg.parts.length > 0)
              contentStr = JSON.stringify(dbMsg.parts);
          } else if (dbMsg.parts != null) {
            contentStr = JSON.stringify(dbMsg.parts);
          }
          return {
            id: dbMsg.id,
            role: dbMsg.role as UIMessage['role'],
            parts: (dbMsg.parts ?? []) as UIMessage['parts'],
            content: contentStr, // Ensure content string exists
            experimental_attachments: (dbMsg.attachments ??
              []) as UIMessage['experimental_attachments'],
            createdAt: new Date(dbMsg.createdAt),
          };
        },
      );
      console.log(
        '[SERVER_API_CHAT_DEBUG] uiPreviousMessagesForAI (mapped from DB with content field). Count:',
        uiPreviousMessagesForAI.length,
        'Last few:',
        JSON.stringify(uiPreviousMessagesForAI.slice(-3), null, 2),
      );

      let reconstructedUiMessages = appendClientMessage({
        messages: uiPreviousMessagesForAI,
        message: incomingUserMessageFromClient as UIMessage,
      });
      console.log(
        '[SERVER_API_CHAT_DEBUG] reconstructedUiMessages (after appendClientMessage). Count:',
        reconstructedUiMessages.length,
        'Last message:',
        JSON.stringify(reconstructedUiMessages.slice(-1)[0], null, 2),
      );

      // Ensure 'content' property is present on all messages in reconstructedUiMessages
      reconstructedUiMessages = reconstructedUiMessages.map((msg) => {
        if (typeof msg.content !== 'string') {
          let contentStr = '';
          if (Array.isArray(msg.parts)) {
            contentStr = msg.parts
              .filter(
                (p) => p.type === 'text' && typeof (p as any).text === 'string',
              )
              .map((p) => (p as any).text)
              .join('\n');
            if (!contentStr && msg.parts.length > 0)
              contentStr = JSON.stringify(msg.parts);
          } else if (msg.parts != null) {
            contentStr = JSON.stringify(msg.parts);
          }
          return { ...msg, content: contentStr };
        }
        return msg;
      });
      console.log(
        '[SERVER_API_CHAT_DEBUG] reconstructedUiMessages (after ensuring content field). Count:',
        reconstructedUiMessages.length,
        'Last message:',
        JSON.stringify(reconstructedUiMessages.slice(-1)[0], null, 2),
      );

      console.log(
        '[SERVER_API_CHAT_DEBUG] Calling convertToCoreMessages with reconstructedUiMessages. Count:',
        reconstructedUiMessages.length,
      );
      const finalMessagesForAI = convertToCoreMessages(reconstructedUiMessages);
      console.log(
        '[SERVER_API_CHAT_DEBUG] finalMessagesForAI (for streamText). Count:',
        finalMessagesForAI.length,
        'Last message content:',
        finalMessagesForAI.length > 0
          ? finalMessagesForAI.slice(-1)[0].content
          : 'N/A',
      );

      return createDataStreamResponse({
        execute: async (dataStream) => {
          console.log(
            `[SERVER_API_CHAT_DEBUG] Calling assembleTools for userId: ${userId}, chatId: ${chatId}`,
          );
          const combinedTools = await assembleTools({
            userId: userId,
            dataStream,
            chatId: chatId,
          });
          const toolNames = Object.keys(combinedTools || {});
          console.log(
            `[SERVER_API_CHAT_DEBUG] Assembled tools. Count: ${toolNames.length}, Names: ${
              toolNames.join(', ') || 'None'
            }`,
          );

          console.log(
            `[SERVER_API_CHAT_DEBUG] Calling streamText for standard chat ${chatId} with Langsmith telemetry enabled.`,
          );
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel }),
            messages: finalMessagesForAI, // Use the converted CoreMessage[]
            maxSteps: 5,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: combinedTools,
            onFinish: async ({ response }) => {
              if (userId) {
                try {
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter(
                      (message) => message.role === 'assistant',
                    ),
                  });
                  if (!assistantId)
                    throw new Error('No assistant message found!');

                  const [, assistantUIMessage] = appendResponseMessages({
                    messages: [incomingUserMessageFromClient as UIMessage], // Cast incomingUserMessageFromClient
                    responseMessages: response.messages,
                  });

                  // Construct DBMessage-like object from assistantUIMessage for saving
                  const assistantMessageToSave: NewDBMessage = {
                    id: assistantId,
                    chatId: chatId,
                    role: 'assistant',
                    parts: assistantUIMessage.parts,
                    attachments:
                      assistantUIMessage.experimental_attachments ?? [],
                    createdAt: new Date(),
                  };
                  await saveMessages({ messages: [assistantMessageToSave] });
                } catch (error) {
                  console.error(
                    '[SERVER_API_CHAT_DEBUG] Failed to save standard chat message after stream:',
                    error,
                  );
                }
              }
            },
            experimental_telemetry: AISDKExporter.getSettings(),
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
    }
  } catch (error) {
    console.error('[SERVER_API_CHAT_DEBUG] Error in POST /api/chat:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request structure',
          details: error.issues,
        }),
        { status: 400 },
      );
    }
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
