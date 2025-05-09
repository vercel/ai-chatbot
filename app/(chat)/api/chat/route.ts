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
import { after } from 'next/server';
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
import { parseRequestBody } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { getUserPersonas } from '@/lib/db/queries';
import { resumable } from 'ai/rsc';

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
        waitUntil: after,
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
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
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

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: async (dataStream) => {
        try {
          // Debug logging for API configuration
          console.log('Using chat model:', selectedChatModel);

          // Normalize the model ID but preserve the exact format for API calls
          // Remove any date suffixes that might be in the ID (e.g., -2024-09-12)
          const modelIdWithoutDate = selectedChatModel.replace(
            /-\d{4}-\d{2}-\d{2}$/,
            '',
          );

          // Get the exact model ID from the database if possible
          let exactModelId: string;
          try {
            const enabledModels = await getEnabledChatModels();

            // Find matching model (case insensitive)
            const matchingModel = enabledModels.find(
              (model) =>
                model.modelId.toLowerCase() ===
                  modelIdWithoutDate.toLowerCase() ||
                `${model.providerId.split('-')[0]}-${model.modelId}`.toLowerCase() ===
                  modelIdWithoutDate.toLowerCase(),
            );

            exactModelId = matchingModel
              ? matchingModel.modelId
              : modelIdWithoutDate;
          } catch (error) {
            console.warn(
              'Error fetching exact model ID from database, using normalized ID',
              error,
            );
            exactModelId = modelIdWithoutDate;
          }

          // Normalize for AI SDK provider lookup
          const normalizedModelId = normalizeModelId(exactModelId, true);
          console.log(`Using model ID: ${normalizedModelId}`);

          // Extract provider from model ID
          const provider = normalizedModelId.split('-')[0] || 'openai';

          // Check if we have API keys in the environment
          const envApiKey =
            provider === 'openai'
              ? process.env.OPENAI_API_KEY
              : provider === 'xai'
                ? process.env.XAI_API_KEY
                : null;

          // If not in environment, check database
          if (!envApiKey) {
            console.log(
              `No ${provider} API key found in environment variables. Checking database...`,
            );

            try {
              // Get from database
              const { getProviderBySlug } = await import('@/lib/db/queries');
              const providerData = await getProviderBySlug(provider);

              if (!providerData?.apiKey) {
                // No API key found anywhere
                const errorMessage = `No API key found for ${provider}. Please configure the API key in the admin panel.`;
                console.error(errorMessage);
                dataStream.writeData({
                  type: 'error',
                  error: errorMessage,
                });
                return;
              }

              // We found an API key in the database - set it in environment for this request
              console.log(`Using ${provider} API key from database`);
              process.env[`${provider.toUpperCase()}_API_KEY`] =
                providerData.apiKey;

              if (providerData.baseUrl) {
                process.env[`${provider.toUpperCase()}_BASE_URL`] =
                  providerData.baseUrl;
              }
            } catch (dbError: any) {
              console.error(
                `Error fetching ${provider} API key from database:`,
                dbError,
              );
              dataStream.writeData({
                type: 'error',
                error: `Error fetching API configuration: ${dbError.message || 'Unknown error'}`,
              });
              return;
            }
          }

          // Now the API key is either in the environment or has been temporarily set
          try {
            try {
              // Try to use the requested model, but fall back to a default if not found
              let modelToUse: any;
              try {
                modelToUse = updatedMyProvider.languageModel(normalizedModelId);
              } catch (modelError: any) {
                console.warn(
                  `Model ${normalizedModelId} not found, falling back to gpt-4o: ${modelError.message}`,
                );
                // Fall back to a known working model
                modelToUse = updatedMyProvider.languageModel('openai-gpt-4o');
              }

              const result = streamText({
                model: modelToUse,
                system: systemPrompt({
                  selectedChatModel: normalizedModelId,
                  requestHints,
                  userPersona: defaultPersona,
                }),
                messages,
                maxSteps: 5,
                experimental_activeTools:
                  normalizedModelId === 'chat-model-reasoning' ||
                  normalizedModelId === 'openai-reasoning' ||
                  normalizedModelId === 'xai-grok3-mini'
                    ? []
                    : [
                        'getWeather',
                        'createDocument',
                        'updateDocument',
                        'requestSuggestions',
                        'braveSearch',
                      ],
                experimental_transform: smoothStream({ chunking: 'word' }),
                experimental_generateMessageId: generateUUID,
                tools: {
                  getWeather,
                  createDocument: createDocument({ session, dataStream }),
                  updateDocument: updateDocument({ session, dataStream }),
                  requestSuggestions: requestSuggestions({
                    session,
                    dataStream,
                  }),
                  braveSearch: tool({
                    description:
                      'Search the web for real-time information about any topic',
                    parameters: braveSearchSchema,
                    execute: braveSearch,
                  }),
                },
                onFinish: async ({ response }) => {
                  if (session.user?.id) {
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
                        messages: [message],
                        responseMessages: response.messages,
                      });

                      await saveMessages({
                        messages: [
                          {
                            id: assistantId,
                            chatId: id,
                            role: assistantMessage.role,
                            parts: assistantMessage.parts,
                            attachments:
                              assistantMessage.experimental_attachments ?? [],
                            createdAt: new Date(),
                          },
                        ],
                      });
                    } catch (error) {
                      console.error('Failed to save chat:', error);
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
            } catch (error: any) {
              console.error('Error in streamText:', error);
              // Add more detailed error information
              const errorDetails = {
                originalModelId: selectedChatModel,
                normalizedModelId,
                provider,
                apiKeyExists:
                  !!process.env[`${provider.toUpperCase()}_API_KEY`],
                baseUrlExists:
                  !!process.env[`${provider.toUpperCase()}_BASE_URL`],
                error: error.message || 'Unknown error',
              };
              console.error('Model configuration details:', errorDetails);

              dataStream.writeData({
                type: 'error',
                error: `Error generating response: ${error.message || 'Unknown error'}`,
              });
            }
          } catch (error: any) {
            console.error('Error in streamText execution:', error);
            dataStream.writeData({
              type: 'error',
              error: `Error generating response: ${error.message || 'Unknown error'}`,
            });
          }
        } catch (error: any) {
          console.error('Error in streamText:', error);
          dataStream.writeData({
            type: 'error',
            error: `Error generating response: ${error.message || 'Unknown error'}`,
          });
        }
      },
      onError: (error: any) => {
        console.error('Stream error:', error);
        return `Error: ${error.message || 'An unknown error occurred during generation'}`;
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
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

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
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
