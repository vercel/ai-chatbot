import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
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
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { allModels } from '@/lib/ai/models';
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

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
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

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Find the model definition to check its capabilities
        const modelDef = allModels.find(m => m.id === selectedChatModel);
        
        // Check if this is a reasoning/thinking model that may not support tools
        const hasThinkingCapability = modelDef?.capabilities.thinking === true;
        const hasReasoningCapability = modelDef?.capabilities.reasoning === true;
        const isModernReasoningModel = selectedChatModel.startsWith('o3') || selectedChatModel.startsWith('o4-');
        const isLegacyReasoningModel = selectedChatModel === 'chat-model-reasoning';
        
        // Models with thinking capability may have limitations with tools and system prompts
        const isReasoningModel = isLegacyReasoningModel || isModernReasoningModel || hasThinkingCapability;
        
        // Debug logging for model selection and configuration
        if (process.env.NODE_ENV === 'development') {
          console.log(`\n🤖 Chat API Model Debug:`);
          console.log(`📝 Selected model: ${selectedChatModel}`);
          console.log(`🎨 Model definition found: ${!!modelDef}`);
          console.log(`🧠 Has thinking capability: ${hasThinkingCapability}`);
          console.log(`🎯 Has reasoning capability: ${hasReasoningCapability}`);
          console.log(`🔧 Is legacy reasoning model: ${isLegacyReasoningModel}`);
          console.log(`⚡ Is modern reasoning model: ${isModernReasoningModel}`);
          console.log(`🎯 Final reasoning model status: ${isReasoningModel}`);
          console.log(`🔧 Tools disabled: ${isReasoningModel}`);
          console.log(`📨 System prompt enabled: ${!isModernReasoningModel && !hasThinkingCapability}`);
          console.log(`🎨 Transform enabled: ${!isModernReasoningModel && !hasThinkingCapability}`);
          console.log(`👤 User: ${session.user.email || session.user.id} (${session.user.type})`);
        }
        
        // Configure streamText options based on model type
        const streamOptions: any = {
          model: myProvider.languageModel(selectedChatModel),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        };

        // Modern reasoning models and thinking models may have special limitations
        if (!isModernReasoningModel && !hasThinkingCapability) {
          // Add system prompt for non-thinking models
          streamOptions.system = systemPrompt({ selectedChatModel, requestHints });
          // Add transform for non-thinking models  
          streamOptions.experimental_transform = smoothStream({ chunking: 'word' });
        }

        // Add tools only for non-reasoning models
        if (!isReasoningModel) {
          streamOptions.experimental_activeTools = [
            'getWeather',
            'createDocument',
            'updateDocument',
            'requestSuggestions',
          ];
          streamOptions.tools = {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          };
        }

        const result = streamText(streamOptions);

        result.consumeStream();

        // Debug stream result
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌊 Stream initialized for model: ${selectedChatModel}`);
        }

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Stream finished for ${selectedChatModel}. Messages received: ${messages.length}`);
          console.log(`📄 Message types:`, messages.map(m => `${m.role}(${m.parts?.length || 0} parts)`).join(', '));
        }
        
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
      onError: (error) => {
        console.error(`❌ Stream error for ${selectedChatModel}:`, error);
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

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
