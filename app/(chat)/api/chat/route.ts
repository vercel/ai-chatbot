import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
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
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
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
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60;

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
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
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

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: databaseUser.id,
        title,
        visibility: selectedVisibilityType,
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

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
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
          getTranscriptDetails: getTranscriptDetails({
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
          // Add web search for o3 and gpt-4.1 models
          ...((selectedChatModel === 'o3' ||
            selectedChatModel === 'gpt-4.1') && {
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
          }),
        };

        if (session.permissions?.includes('access:weather:any')) {
          tools.getWeather = getWeather;
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : Object.keys(tools),
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: tools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
          // Add providerOptions for o3 and gpt-4.1 models
          ...((selectedChatModel === 'o3' ||
            selectedChatModel === 'gpt-4.1') && {
            providerOptions: {
              openai: {
                reasoningSummary: 'auto', // Use 'auto' for condensed or 'detailed' for comprehensive
              },
            },
          }),
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
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

  if (chat.userId !== databaseUser.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
