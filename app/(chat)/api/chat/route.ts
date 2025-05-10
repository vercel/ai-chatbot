import 'server-only';
import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  tool,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import { normalizeModelId } from '@/lib/ai/client-models';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getDefaultUserPersona,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  getProviderBySlug,
  getEnabledChatModels,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { braveSearch, braveSearchSchema } from '@/lib/ai/tools/brave-search';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import {
  postRequestBodySchema,
  aiSdkRequestSchema,
  type AiSdkRequest,
  type PostRequestBody,
} from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';

import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import {
  myProvider as updatedMyProvider,
  getProviderConfig,
  getImageModelForProvider,
} from '@/lib/ai/providers';
import {
  createStreamDataStream,
  DataMessage,
  DataStreamOptions,
} from '@/lib/stream-data';

import { NextRequest, NextResponse } from 'next/server';
import { getUserPersonas } from '@/lib/db/queries';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      // Check if REDIS_URL is properly configured
      const redisUrl =
        process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      if (!redisUrl || redisUrl.includes('SSS')) {
        console.log(
          ' > Resumable streams are disabled due to invalid Redis URL configuration',
        );
        return null;
      }

      globalStreamContext = createResumableStreamContext({
        // Simplified version that doesn't use after
        waitUntil: (promise: Promise<any>) => {
          /* This is a temporary fix for the build */
          return promise;
        },
      });
    } catch (error: any) {
      console.error('Failed to initialize resumable streams:', error);
      if (
        error.message.includes('REDIS_URL') ||
        error.code === 'ERR_INVALID_URL'
      ) {
        console.log(
          ' > Resumable streams are disabled due to Redis configuration error',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let customRequestBody: PostRequestBody;
  let isAiSdkFormat = false;

  try {
    const json = await request.json();

    // Try to parse as AI SDK format first
    if (json.messages && Array.isArray(json.messages)) {
      try {
        aiSdkRequestSchema.parse(json);
        isAiSdkFormat = true;
      } catch (error) {
        console.error('Failed to parse as AI SDK format:', error);
      }
    }

    if (isAiSdkFormat) {
      const aiSdkRequest = json as AiSdkRequest;

      // Extract last user message
      const lastMessage =
        aiSdkRequest.messages[aiSdkRequest.messages.length - 1];
      if (lastMessage.role !== 'user') {
        return new Response('Last message must be from user', { status: 400 });
      }

      // Generate a chat ID if not provided
      const chatId = json.id || generateUUID();

      // Create our custom format
      customRequestBody = {
        id: chatId,
        message: {
          id: generateUUID(),
          createdAt: new Date(),
          role: 'user',
          content:
            typeof lastMessage.content === 'string' ? lastMessage.content : '',
          parts: [
            {
              type: 'text',
              text:
                typeof lastMessage.content === 'string'
                  ? lastMessage.content
                  : '',
            },
          ],
        },
        selectedChatModel: json.selectedChatModel || 'openai-gpt4o', // Default model
        selectedVisibilityType: json.selectedVisibilityType || 'private', // Default visibility
      };
    } else {
      // Try our custom format
      customRequestBody = postRequestBodySchema.parse(json);
    }
  } catch (error) {
    console.error('Invalid request body:', error);
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      customRequestBody;

    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userType: UserType = session.user.type;

    // Try to fetch user's default persona but don't wait or block on failure
    let defaultPersona = null;
    try {
      defaultPersona = await getDefaultUserPersona(session.user.id);
    } catch (error) {
      console.error(
        'Failed to fetch default persona, using system defaults:',
        error,
      );
      // Continue with null persona - the systemPrompt function will use defaults
    }

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new Response(
        'You have exceeded your maximum number of messages for the day! Please try again later.',
        {
          status: 429,
        },
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      messages: previousMessages as any[],
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    let streamId: string | null = null;
    const streamIds = await getStreamIdsByChatId({ chatId: id });
    if (streamIds.length === 0) {
      const newStreamId = generateUUID(); // Generate a new UUID for the stream
      await createStreamId({ streamId: newStreamId, chatId: id });
      streamId = newStreamId; // Assign the newStreamId to the outer streamId variable
    } else {
      streamId = streamIds[0]; // Corrected: streamIds is an array of strings
    }

    function createStreamableModel(model: string) {
      const traceEnabled =
        typeof process !== 'undefined'
          ? process.env.TRACE_AI === 'true'
          : false;

      const normalizedModelId = normalizeModelId(model) || model;

      console.log(
        '[DEBUG] Inside createStreamableModel, model:',
        model,
        'normalizedModelId:',
        normalizedModelId,
      );
      console.log(
        '[DEBUG] Inside createStreamableModel, myProvider.languageModels keys:',
        myProvider.languageModels
          ? Object.keys(myProvider.languageModels)
          : 'myProvider.languageModels is undefined',
      );

      const selectedModel = myProvider.languageModels[normalizedModelId];

      if (!selectedModel) {
        throw new Error(
          `Model ${normalizedModelId} not found. Available models: ${Object.keys(myProvider.languageModels).join(', ')}`,
        );
      }

      return selectedModel;
    }

    async function generateStream(dataStream: ReadableStream) {
      const tools = [
        tool({
          name: 'get_weather',
          description: 'Get weather information for a specific location.',
          execute: getWeather,
        }),
        tool({
          name: 'search',
          description: 'Search the web for information.',
          execute: braveSearch,
          schema: braveSearchSchema,
        }),
        tool({
          name: 'create_document',
          description: 'Create a new document',
          execute: createDocument,
        }),
        tool({
          name: 'update_document',
          description: 'Update an existing document',
          execute: updateDocument,
        }),
        tool({
          name: 'request_suggestions',
          description: 'Request suggestions for continuing the conversation',
          execute: requestSuggestions,
        }),
      ];

      const model = createStreamableModel(selectedChatModel);

      const chatMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content as string,
      }));

      const system = systemPrompt({
        persona: defaultPersona,
        requestHints,
      });

      const debug =
        typeof process !== 'undefined'
          ? process.env.DEBUG_AI === 'true'
          : false;
      if (debug) {
        console.log('System prompt:', system);
      }

      try {
        const streamContext = getStreamContext();
        const resumableStream =
          streamContext && streamId // Ensure streamId is not null
            ? await streamContext.resumableStream(streamId, () =>
                streamText({
                  model,
                  messages: [
                    { role: 'system', content: system },
                    ...chatMessages,
                  ],
                  tools,
                }),
              )
            : null;

        if (
          typeof process !== 'undefined' &&
          process.env.SMOOTH_STREAMING === 'true' &&
          resumableStream
        ) {
          return smoothStream({
            stream: resumableStream,
            interval: 50,
          });
        }

        return streamText({
          model,
          messages: [{ role: 'system', content: system }, ...chatMessages],
          tools,
        });
      } catch (error) {
        console.error('Error creating stream:', error);
        throw error;
      }
    }

    const ctx = createStreamDataStream();

    const dataStream = createDataStream({
      execute: async ({ writeData }) => {
        try {
          const startTime = Date.now();

          const stream = await generateStream(
            null as unknown as ReadableStream,
          );

          const { messages: newMessages } = await appendResponseMessages({
            messages,
            stream,
            experimental_streamData: true,
          });

          const response = newMessages[newMessages.length - 1];

          const timeToFirstToken = differenceInSeconds(new Date(), startTime);

          if (
            typeof process !== 'undefined' &&
            process.env.DEBUG_AI === 'true'
          ) {
            console.log('Time to first token:', timeToFirstToken, 'seconds');
            console.log('Response:', response);
          }

          await saveMessages({
            messages: [
              {
                chatId: id,
                id: response.id,
                role: 'assistant',
                content: response.content,
                createdAt: new Date(),
              },
            ],
          });

          if (response.experimental_reasoning) {
            writeData({
              type: 'reasoning',
              content: response.experimental_reasoning,
            });
          }

          if (response.experimental_functionToolCalls) {
            for (const call of response.experimental_functionToolCalls) {
              writeData({
                type: 'tool_call',
                tool: call.name,
                args: call.args,
                id: call.id,
              });
            }
          }

          writeData({ type: 'done' });
        } catch (error) {
          console.error('Error processing stream:', error);
          writeData({
            type: 'error',
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      },
    });

    return new Response(dataStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Stream-ID': streamId || 'none',
      },
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('id is required', { status: 400 });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new Response('Not found', { status: 404 });
  }

  if (!chat) {
    return new Response('Not found', { status: 404 });
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new Response('No streams found', { status: 404 });
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new Response('No recent stream found', { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
