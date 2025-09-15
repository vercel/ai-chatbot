import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  type LanguageModelUsage,
  smoothStream,
  stepCountIs,
  streamText,
  validateUIMessages,
} from 'ai';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getDatabaseUserFromWorkOS,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
  getAgentWithUserState,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { searchTranscriptsByKeyword } from '@/lib/ai/tools/search-transcripts-by-keyword';
import { searchTranscriptsByUser } from '@/lib/ai/tools/search-transcripts-by-user';
import { getTranscriptDetails } from '@/lib/ai/tools/get-transcript-details';
import { listAccessibleSlackChannels } from '@/lib/ai/tools/list-accessible-slack-channels';
import { fetchSlackChannelHistory } from '@/lib/ai/tools/fetch-slack-channel-history';
import { getSlackThreadReplies } from '@/lib/ai/tools/get-slack-thread-replies';
import { getBulkSlackHistory } from '@/lib/ai/tools/get-bulk-slack-history';
import { listGoogleCalendarEvents } from '@/lib/ai/tools/list-google-calendar-events';
import { listGmailMessages } from '@/lib/ai/tools/list-gmail-messages';
import { getGmailMessageDetails } from '@/lib/ai/tools/get-gmail-message-details';
// Note: Mem0 tool definitions are intentionally not imported here to avoid
// exposing them to the LLM tool registry. Definitions remain available under
// `lib/ai/tools/*mem0*` and `lib/mem0/*` for future re‑enablement.
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { VisibilityType } from '@/components/visibility-selector';
import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';

export const maxDuration = 800; // This function can run for a maximum of 5 seconds

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      reasoningEffort,
      selectedVisibilityType,
      agentSlug,
      agentContext: previewAgentContext,
      activeTools: requestedActiveTools,
    }: {
      id: string;
      message: ChatMessage;
      reasoningEffort: 'low' | 'medium' | 'high';
      selectedVisibilityType: VisibilityType;
      agentSlug?: string;
      agentContext?: {
        agentName: string;
        agentDescription?: string;
        agentPrompt?: string;
      };
      activeTools?: Array<string>;
    } = requestBody;

    const session = await withAuth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Get the database user from the WorkOS user
    const databaseUser = await getDatabaseUserFromWorkOS({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? undefined,
      lastName: session.user.lastName ?? undefined,
    });

    if (!databaseUser) {
      return new ChatSDKError(
        'unauthorized:chat',
        'User not found',
      ).toResponse();
    }

    // Fetch agent data if agentSlug provided; otherwise allow preview agent context passthrough
    let agentContext = null as
      | (Awaited<ReturnType<typeof getAgentWithUserState>> | null)
      | null;
    if (agentSlug) {
      const agentData = await getAgentWithUserState({
        slug: agentSlug,
        userId: databaseUser.id,
      });
      agentContext = agentData;
    }

    const chat = await getChatById({ id });

    // Debug: confirm preview agent context is received
    if (!agentSlug && previewAgentContext) {
      console.log('🧪 Preview agentContext received:', {
        hasName: !!previewAgentContext.agentName,
        hasPrompt: !!previewAgentContext.agentPrompt,
      });
    }

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: databaseUser.id,
        title,
        visibility: selectedVisibilityType,
        agentId: agentContext?.agent?.id,
      });
    } else {
      if (chat.userId !== databaseUser.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
      email: session.user.email,
      name:
        session.user.firstName && session.user.lastName
          ? `${session.user.firstName} ${session.user.lastName}`
          : (session.user.firstName ?? undefined),
      date: new Date().toISOString(),
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    // Check role for tool availability
    const isMemberRole = session.role === 'member';
    console.log(
      `🔐 User ${session.user.email} role: ${session.role} (${isMemberRole ? 'MEMBER - limited access' : 'ELEVATED - full access'})`,
    );

    // Create session adapter for AI tools with database user ID
    const aiToolsSession = {
      user: {
        id: databaseUser.id, // Use database user ID instead of WorkOS user ID
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
      role: session.role, // Move role to session level to match Session interface
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    let finalUsage: LanguageModelUsage | undefined;

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        // Build your tool set (the same set you pass to streamText)
        const tools: Record<string, any> = {
          createDocument: createDocument({
            session: aiToolsSession,
            dataStream,
          }),
          updateDocument: updateDocument({
            session: aiToolsSession,
            dataStream,
          }),
          requestSuggestions: requestSuggestions({
            session: aiToolsSession,
            dataStream,
          }),
          searchTranscriptsByKeyword: searchTranscriptsByKeyword({
            session: aiToolsSession,
            dataStream,
          }),
          searchTranscriptsByUser: searchTranscriptsByUser({
            session: aiToolsSession,
            dataStream,
          }),
          listAccessibleSlackChannels: listAccessibleSlackChannels({
            session: aiToolsSession,
            dataStream,
          }),
          fetchSlackChannelHistory: fetchSlackChannelHistory({
            session: aiToolsSession,
            dataStream,
          }),
          getSlackThreadReplies: getSlackThreadReplies({
            session: aiToolsSession,
            dataStream,
          }),
          getBulkSlackHistory: getBulkSlackHistory({
            session: aiToolsSession,
            dataStream,
          }),
          listGoogleCalendarEvents: listGoogleCalendarEvents({
            session: aiToolsSession,
            dataStream,
          }),
          listGmailMessages: listGmailMessages({
            session: aiToolsSession,
            dataStream,
          }),
          getGmailMessageDetails: getGmailMessageDetails({
            session: aiToolsSession,
            dataStream,
          }),
          // Add web search for the unified openai chat model
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: 'high',
            userLocation:
              requestHints.city && requestHints.country
                ? {
                    type: 'approximate',
                    city: requestHints.city,
                    region: requestHints.country,
                  }
                : undefined,
          }),
        };

        // Add transcript details tool only for elevated roles (not members)
        if (!isMemberRole) {
          console.log(
            `✅ Adding getTranscriptDetails tool for elevated role: ${session.role} (${session.user.email})`,
          );
          tools.getTranscriptDetails = getTranscriptDetails({
            session: aiToolsSession,
            dataStream,
          });
        } else {
          console.log(
            `🚫 Excluding getTranscriptDetails tool for member role: ${session.user.email}`,
          );
        }

        // 1) Validate the full UI history against your tool schemas
        const availableToolIds = Object.keys(tools);
        const activeToolsForRun =
          requestedActiveTools !== undefined
            ? availableToolIds.filter((toolId) =>
                requestedActiveTools.includes(toolId),
              )
            : availableToolIds;

        const validated = await validateUIMessages({
          messages: uiMessages,
          tools, // <= critical for typed tool parts like tool-web_search_preview
        });

        // 2) Convert to model messages with the same tool registry
        const modelMessages = convertToModelMessages(validated, { tools });

        const result = streamText({
          model: myProvider.languageModel('chat-model'),
          system: systemPrompt({
            selectedChatModel: 'chat-model',
            requestHints,
            agentContext: agentSlug
              ? agentContext
                ? {
                    agentPrompt: agentContext.agent.agentPrompt || '',
                    agentName: agentContext.agent.name,
                  }
                : undefined
              : previewAgentContext
                ? {
                    agentPrompt: previewAgentContext.agentPrompt || '',
                    agentName: previewAgentContext.agentName || 'Preview Agent',
                  }
                : undefined,
          }),
          messages: modelMessages, // <= not UI parts anymore
          stopWhen: stepCountIs(50),
          activeTools: activeToolsForRun,
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: tools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
          providerOptions: {
            openai: {
              reasoningEffort: reasoningEffort,
              reasoningSummary: 'auto',
            } satisfies OpenAIResponsesProviderOptions,
          },
          onFinish: ({ usage }) => {
            finalUsage = usage;
            dataStream.write({ type: 'data-usage', data: usage });
          },
          onStepFinish: (stepResult) => {
            // First log the raw structure to understand what we're working with
            console.log(
              '🔥 STEP FINISH - RAW:',
              JSON.stringify(stepResult, null, 2),
            );

            // Log basic step info safely
            console.log('🔥 STEP FINISH:', {
              finishReason: stepResult.finishReason,
              usage: stepResult.usage ? JSON.stringify(stepResult.usage) : null,
              keys: Object.keys(stepResult),
            });

            // Check for tool calls using type guards
            if ('toolCalls' in stepResult && stepResult.toolCalls) {
              console.log(
                '🔥 TOOL CALLS FOUND:',
                stepResult.toolCalls.map((tc) => ({
                  toolName: tc.toolName,
                  properties: Object.keys(tc),
                  tc: tc,
                })),
              );
            }

            // Check for tool results using type guards
            if ('toolResults' in stepResult && stepResult.toolResults) {
              console.log(
                '🔥 TOOL RESULTS FOUND:',
                stepResult.toolResults.map((tr) => ({
                  toolName: tr.toolName,
                  properties: Object.keys(tr),
                  tr: tr,
                })),
              );
            }

            // Check for text using type guards
            if ('text' in stepResult && stepResult.text) {
              console.log(
                '🔥 TEXT FOUND:',
                `${stepResult.text.substring(0, 100)}...`,
              );
            }
          },
        });

        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            sendSources: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages, responseMessage }) => {
        console.log('full response', responseMessage);
        await saveMessages({
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalUsage,
            });
          } catch (err) {
            console.warn('Unable to persist last usage for chat', id, err);
          }
        }
      },
      onError: (error) => {
        console.error('Error in chat API:', error);
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unhandled error in chat API:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await withAuth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get the database user from the WorkOS user
  const databaseUser = await getDatabaseUserFromWorkOS({
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName ?? undefined,
    lastName: session.user.lastName ?? undefined,
  });

  if (!databaseUser) {
    return new ChatSDKError('unauthorized:chat', 'User not found').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
