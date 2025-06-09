/**
 * @file app/api/chat/route.ts
 * @description API маршрут для обработки запросов чата.
 * @version 3.1.0
 * @date 2025-06-09
 * @updated Упрощен код для соответствия новой архитектуре инструментов. Удалена логика resumable-stream.
 */

/** HISTORY:
 * v3.1.0 (2025-06-09): Финальный рефакторинг, удалена логика resumable-stream и createDataStream.
 * v3.0.1 (2025-06-09): Исправлен вызов на `toDataStreamResponse`.
 * v3.0.0 (2025-06-09): Рефакторинг для использования `toAIStreamResponse` и удаления кастомной логики стриминга.
 */

import {
  appendResponseMessages,
  type CoreMessage,
  type ImagePart,
  type Message,
  streamText,
  StreamingTextResponse,
  type TextPart,
  type ToolCallPart,
  type ToolResultPart,
  type UIMessage,
} from 'ai'
import { auth, type UserType } from '@/app/(auth)/auth'
import { type ArtifactContext, type RequestHints, systemPrompt } from '@/lib/ai/prompts'
import {
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries'
import { generateUUID } from '@/lib/utils'
import { generateTitleFromUserMessage } from '@/app/(main)/chat/actions'
import { createDocument } from '@/lib/ai/tools/create-document'
import { updateDocument } from '@/lib/ai/tools/update-document'
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { getDocument } from '@/lib/ai/tools/get-document'
import { myProvider } from '@/lib/ai/providers'
import { entitlementsByUserType } from '@/lib/ai/entitlements'
import { type PostRequestBody, postRequestBodySchema } from './schema'
import { geolocation } from '@vercel/functions'
import { ChatSDKError } from '@/lib/errors'
import { createLogger } from '@fab33/sys-logger'

const parentLogger = createLogger('api:chat:route');

export const maxDuration = 60

/**
 * @description Преобразует массив сообщений из формата UI (`UIMessage[]`) в формат, понятный ядру AI (`CoreMessage[]`).
 * @important ЭТО КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ. Не удаляйте этот JSDoc.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/use-chat
 * @see https://ai-sdk.dev/docs/ai-sdk-core/core-message
 */
async function transformToCoreMessages (uiMessages: UIMessage[]): Promise<CoreMessage[]> {
  const logger = parentLogger.child({ function: 'transformToCoreMessages' });
  logger.trace({ messagesCount: uiMessages.length }, 'Entering transformToCoreMessages');
  const coreMessages: CoreMessage[] = []

  for (const uiMessage of uiMessages) {
    switch (uiMessage.role) {
      case 'user': {
        const contentParts: (TextPart | ImagePart)[] = [{ type: 'text', text: uiMessage.content }]
        if (uiMessage.experimental_attachments) {
          logger.debug('Processing attachments for user message');
          for (const attachment of uiMessage.experimental_attachments) {
            if (attachment.contentType?.startsWith('image')) {
              const response = await fetch(attachment.url)
              const imageBuffer = await response.arrayBuffer()
              contentParts.push({ type: 'image', image: Buffer.from(imageBuffer), mimeType: attachment.contentType })
            }
          }
        }
        coreMessages.push({ role: 'user', content: contentParts })
        break
      }

      case 'assistant': {
        const assistantContentParts: (TextPart | ToolCallPart)[] = []
        const toolResultParts: ToolResultPart[] = []

        for (const part of uiMessage.parts ?? []) {
          // @ts-ignore - 'type' is a common property, but TS struggles with the union
          switch (part.type) {
            case 'text':
              assistantContentParts.push(part)
              break
            case 'tool-invocation': {
              const { state, toolCallId, toolName, args } = part.toolInvocation
              if (state === 'call') {
                logger.debug({ toolName, toolCallId }, 'Transforming tool-call part');
                assistantContentParts.push({ type: 'tool-call', toolCallId, toolName, args })
              } else if (state === 'result') {
                logger.debug({ toolName, toolCallId }, 'Transforming tool-result part');
                toolResultParts.push({ type: 'tool-result', toolCallId, toolName, result: part.toolInvocation.result })
              }
              break
            }
          }
        }

        if (assistantContentParts.length > 0) {
          coreMessages.push({
            role: 'assistant',
            content: assistantContentParts,
          })
        }

        if (toolResultParts.length > 0) {
          coreMessages.push({
            role: 'tool',
            content: toolResultParts,
          })
        }
        break
      }

      case 'system':
      case 'data':
        coreMessages.push(uiMessage as CoreMessage)
        break
    }
  }
  logger.trace({ coreMessagesCount: coreMessages.length }, 'Exiting transformToCoreMessages');
  return coreMessages
}


function getContextFromHistory (messages: PostRequestBody['messages']): ArtifactContext | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.parts) {
      for (const part of message.parts) {
        // @ts-ignore
        if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
          // @ts-ignore
          const { toolName, result } = part.toolInvocation
          if (result?.id && ['createDocument', 'updateDocument', 'getDocument'].includes(toolName)) {
            return {
              id: result.id,
              title: result.title,
              kind: result.kind,
            }
          }
        }
      }
    }
  }
  return undefined
}


export async function POST (request: Request) {
  const logger = parentLogger.child({ requestId: generateUUID(), method: 'POST' });
  logger.trace('Entering POST /api/chat');
  try {
    const requestBody = postRequestBodySchema.parse(await request.json())
    logger.debug({ requestBody: { ...requestBody, messages: `[${requestBody.messages.length} messages]` } }, 'Request body parsed');


    const {
      id: chatId,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      activeArtifactId,
      activeArtifactTitle,
      activeArtifactKind
    } = requestBody;

    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized chat request');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const childLogger = logger.child({ chatId, userId: session.user.id });

    const userType: UserType = session.user.type;
    const latestMessage = messages.at(-1);

    if (!latestMessage) {
      throw new ChatSDKError('bad_request:api', 'No message found in request.');
    }

    const messageCount = await getMessageCountByUserId({ id: session.user.id, differenceInHours: 24 });
    childLogger.debug({ messageCount }, 'User message count retrieved');

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      throw new ChatSDKError('rate_limit:chat');
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      childLogger.info('Chat not found, creating a new one.');
      const title = await generateTitleFromUserMessage({ message: latestMessage as UIMessage });
      await saveChat({ id: chatId, userId: session.user.id, title, visibility: selectedVisibilityType });
    } else {
      if (chat.userId !== session.user.id) {
        childLogger.warn('Attempt to access forbidden chat');
        throw new ChatSDKError('forbidden:chat');
      }
    }

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };
    childLogger.debug({ requestHints }, 'Geolocation hints');

    const artifactContext: ArtifactContext | undefined =
      activeArtifactId && activeArtifactTitle && activeArtifactKind
        ? { id: activeArtifactId, title: activeArtifactTitle, kind: activeArtifactKind }
        : getContextFromHistory(messages);
    childLogger.debug({ artifactContext }, 'Artifact context determined');

    await saveMessages({ messages: [{
      chatId: chatId,
      id: latestMessage.id,
      role: 'user',
      parts: latestMessage.parts ?? [{ type: 'text', text: latestMessage.content }],
      attachments: latestMessage.experimental_attachments ?? [],
      createdAt: new Date(),
    }]});

    const coreMessagesForModel = await transformToCoreMessages(messages as UIMessage[]);

    childLogger.info('Starting text stream with AI model');
    const result = await streamText({
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
      messages: coreMessagesForModel,
      maxSteps: 6,
      tools: {
        getWeather,
        getDocument,
        createDocument: createDocument({ session }),
        updateDocument: updateDocument({ session }),
        requestSuggestions: requestSuggestions({ session }),
      },
      onFinish: async ({ response }) => {
        childLogger.info('Text stream finished, saving assistant response');
        if (session.user?.id) {
          try {
            const [, assistantMessage] = appendResponseMessages({ messages: [latestMessage as Message], responseMessages: response.messages });
            const assistantId = generateUUID();
            await saveMessages({
              messages: [{
                id: assistantId,
                chatId: chatId,
                role: assistantMessage.role,
                parts: assistantMessage.parts,
                attachments: assistantMessage.experimental_attachments ?? [],
                createdAt: new Date(),
              }]
            });
          } catch (error) {
            childLogger.error({ err: error as Error }, 'Failed to save assistant chat message');
          }
        }
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    logger.error({ err: error as Error }, 'Failed to process chat POST request');
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api', 'Failed to process request.').toResponse();
  }
}


export async function DELETE (request: Request) {
  const logger = parentLogger.child({ method: 'DELETE' });
  logger.trace('Entering DELETE /api/chat');
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  const childLogger = logger.child({ chatId: id });
  const session = await auth()

  if (!session?.user) {
    childLogger.warn('Unauthorized attempt to delete chat');
    return new ChatSDKError('unauthorized:chat').toResponse()
  }

  const chat = await getChatById({ id })

  if (chat.userId !== session.user.id) {
    childLogger.warn('Forbidden attempt to delete chat');
    return new ChatSDKError('forbidden:chat').toResponse()
  }

  const deletedChat = await deleteChatById({ id })

  childLogger.info('Chat deleted successfully');
  return Response.json(deletedChat, { status: 200 })
}

// END OF: app/api/chat/route.ts
