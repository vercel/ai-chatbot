/**
 * @file app/api/chat/route.ts
 * @description API маршрут для обработки запросов чата.
 * @version 2.3.0
 * @date 2025-06-09
 * @updated Исправлены ошибки типов TypeScript в `transformToCoreMessages` (TS2339, TS2678).
 */

/** HISTORY:
 * v2.3.0 (2025-06-09): Исправлена типизация при деструктуризации `toolInvocation` и обработка ролей сообщений.
 * v2.2.0 (2025-06-07): Исправлены ошибки TypeScript (импорт, обработка ролей).
 * v2.1.0 (2025-06-07): Исправлены ошибки TypeScript при обработке изображений и сообщений.
 * v2.0.0 (2025-06-07): Исправлена ошибка с UUID, удален инструмент generateOrModifyImage, добавлена передача картинок в модель.
 */

import {
  appendResponseMessages,
  type CoreAssistantMessage,
  type CoreMessage,
  createDataStream,
  type DataStreamWriter,
  type ImagePart,
  type Message,
  streamText,
  type TextPart,
  type ToolCallPart,
  type ToolResultPart,
  type UIMessage,
} from 'ai'
import { auth, type UserType } from '@/app/(auth)/auth'
import { type ArtifactContext, type RequestHints, systemPrompt } from '@/lib/ai/prompts'
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getDocumentById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
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
import { createResumableStreamContext, type ResumableStreamContext, } from 'resumable-stream'
import { after } from 'next/server'
import type { Chat, Document as DBDocument } from '@/lib/db/schema'
import { differenceInSeconds } from 'date-fns'
import { ChatSDKError } from '@/lib/errors'

export const maxDuration = 60

let globalStreamContext: ResumableStreamContext | null = null

function getStreamContext () {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      })
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        )
      } else {
        console.error(error)
      }
    }
  }

  return globalStreamContext
}

/**
 * @description Преобразует массив сообщений из формата UI (`UIMessage[]`) в формат, понятный ядру AI (`CoreMessage[]`).
 * @important ЭТО КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ. Не удаляйте этот JSDoc.
 * AI SDK использует два разных типа для сообщений:
 * 1. `UIMessage` (из `@ai-sdk/react`): используется в хуке `useChat`. Содержит полную информацию для рендеринга UI,
 *    включая промежуточные шаги (`step-start`, `tool-invocation` и т.д.).
 * 2. `CoreMessage` (из `ai`): используется в серверных функциях, таких как `streamText`. Ожидает "чистую" историю
 *    диалога: только сообщения пользователя, финальные текстовые ответы ассистента (`text` и `tool-call`) и результаты вызова инструментов (`tool-result`).
 *
 * Эта функция решает проблему `AI_TypeValidationError`, преобразуя "сырые" `UIMessage` в валидные `CoreMessage`,
 * отфильтровывая ненужные для модели части (`step-start`, `reasoning`) и корректно форматируя вызовы и результаты инструментов.
 *
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/core-message
 *
 * @param {UIMessage[]} uiMessages - Массив сообщений из клиентского хука `useChat`.
 * @returns {Promise<CoreMessage[]>} - Промис, который разрешается в массив сообщений, готовый для передачи в `streamText`.
 */
async function transformToCoreMessages (uiMessages: UIMessage[]): Promise<CoreMessage[]> {
  const coreMessages: CoreMessage[] = []

  for (const uiMessage of uiMessages) {
    switch (uiMessage.role) {
      case 'user': {
        const contentParts: (TextPart | ImagePart)[] = [{ type: 'text', text: uiMessage.content }]
        if (uiMessage.experimental_attachments) {
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
                assistantContentParts.push({ type: 'tool-call', toolCallId, toolName, args })
              } else if (state === 'result') {
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
          } as CoreAssistantMessage)
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
        // Эти роли совместимы и могут быть переданы напрямую.
        // Роль 'tool' не может прийти от UI, она создается здесь из 'assistant' сообщения.
        coreMessages.push(uiMessage as CoreMessage)
        break
    }
  }
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
  try {
    const requestBody = postRequestBodySchema.parse(await request.json())

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
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const streamId = generateUUID();

    const stream = createDataStream({
      execute: async (writer: DataStreamWriter) => {
        try {
          const userType: UserType = session.user.type;
          const latestMessage = messages.at(-1);

          if (!latestMessage) {
            throw new ChatSDKError('bad_request:api', 'No message found in request.');
          }

          const messageCount = await getMessageCountByUserId({ id: session.user.id, differenceInHours: 24 });

          if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
            throw new ChatSDKError('rate_limit:chat');
          }

          const chat = await getChatById({ id: chatId });

          if (!chat) {
            const title = await generateTitleFromUserMessage({ message: latestMessage as UIMessage });
            await saveChat({ id: chatId, userId: session.user.id, title, visibility: selectedVisibilityType });
          } else {
            if (chat.userId !== session.user.id) {
              throw new ChatSDKError('forbidden:chat');
            }
          }

          const { longitude, latitude, city, country } = geolocation(request);
          const requestHints: RequestHints = { longitude, latitude, city, country };

          const artifactContext: ArtifactContext | undefined =
            activeArtifactId && activeArtifactTitle && activeArtifactKind
              ? { id: activeArtifactId, title: activeArtifactTitle, kind: activeArtifactKind }
              : getContextFromHistory(messages);

          await saveMessages({ messages: [{
            chatId: chatId,
            id: latestMessage.id,
            role: 'user',
            parts: latestMessage.parts ?? [{ type: 'text', text: latestMessage.content }],
            attachments: latestMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          }]});

          await createStreamId({ streamId, chatId });

          const coreMessagesForModel = await transformToCoreMessages(messages as UIMessage[]);

          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
            messages: coreMessagesForModel,
            maxSteps: 6,
            tools: {
              getWeather,
              getDocument,
              createDocument: createDocument({ session, dataStream: writer }),
              updateDocument: updateDocument({ session, dataStream: writer }),
              requestSuggestions: requestSuggestions({ session, dataStream: writer }),
            },
            onFinish: async ({ response }) => {
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
                  console.error('Failed to save chat', error);
                }
              }
            },
          });

          result.mergeIntoDataStream(writer);

        } catch (error) {
          console.error('[DEBUG] #2 API error:', error);
          if (error instanceof ChatSDKError) {
            writer.writeData({ type: 'error', error: error.message });
          } else {
            writer.writeData({ type: 'error', error: 'An unexpected error occurred.' });
          }
        }
      }
    });

    const streamContext = getStreamContext();
    if (streamContext) {
      return new Response(await streamContext.resumableStream(streamId, () => stream));
    } else {
      return new Response(stream);
    }

  } catch (error) {
    console.error('[DEBUG] #1 API error:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api', 'Failed to process request.').toResponse();
  }
}

export async function GET (request: Request) {
  const streamContext = getStreamContext()
  const resumeRequestedAt = new Date()

  if (!streamContext) {
    return new Response(null, { status: 204 })
  }

  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get('chatId')

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  const session = await auth()

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse()
  }

  let chat: Chat

  try {
    chat = await getChatById({ id: chatId })
  } catch {
    return new ChatSDKError('not_found:chat').toResponse()
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse()
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse()
  }

  const streamIds = await getStreamIdsByChatId({ chatId })

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse()
  }

  const recentStreamId = streamIds.at(-1)

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse()
  }

  const emptyDataStream = createDataStream({ execute: () => {} })

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  )

  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId })
    const mostRecentMessage = messages.at(-1)

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 })
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 })
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt)

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 })
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        })
      },
    })

    return new Response(restoredStream, { status: 200 })
  }

  return new Response(stream, { status: 200 })
}

export async function DELETE (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  const session = await auth()

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse()
  }

  const chat = await getChatById({ id })

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse()
  }

  const deletedChat = await deleteChatById({ id })

  return Response.json(deletedChat, { status: 200 })
}

// END OF: app/api/chat/route.ts
