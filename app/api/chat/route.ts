/**
 * @file app/api/chat/route.ts
 * @description API маршрут для обработки запросов чата.
 * @version 1.7.0
 * @date 2025-06-06
 * @updated Добавлена логика реконструкции контекста артефакта из истории сообщений.
 */

/** HISTORY:
 * v1.7.0 (2025-06-06): Добавлена логика реконструкции контекста артефакта.
 * v1.6.0 (2025-06-06): Добавлена логика для включения контекста активного артефакта в системный промпт.
 * v1.5.1 (2025-06-06): Исправлен тип возвращаемого значения `enrichMessagesWithArtifacts`.
 * v1.5.0 (2025-06-06): Добавлено обогащение сообщений метаданными артефактов.
 * v1.4.1 (2025-06-06): Добавлено `as UIMessage` при вызове `generateTitleFromUserMessage`.
 */

import {
  appendResponseMessages,
  type CoreMessage,
  createDataStream,
  type Message,
  smoothStream,
  streamText,
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
import { generateUUID, getTrailingMessageId } from '@/lib/utils'
import { generateTitleFromUserMessage } from '@/app/(main)/chat/actions'
import { createDocument } from '@/lib/ai/tools/create-document'
import { updateDocument } from '@/lib/ai/tools/update-document'
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { getDocument } from '@/lib/ai/tools/get-document'
import { isProductionEnvironment } from '@/lib/constants'
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

async function enrichMessagesWithArtifacts (messages: PostRequestBody['messages']): Promise<CoreMessage[]> {
  const artifactIds = new Set<string>()

  for (const message of messages) {
    if (message.parts) {
      for (const part of message.parts) {
        // @ts-ignore
        if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
          // @ts-ignore
          const result = part.toolInvocation.result as any
          // @ts-ignore
          if (result && result.id && ['createDocument', 'updateDocument', 'getDocument'].includes(part.toolInvocation.toolName)) {
            artifactIds.add(result.id)
          }
        }
      }
    }
  }

  if (artifactIds.size === 0) {
    return messages as CoreMessage[]
  }

  const artifactMetadata = new Map<string, { doc: DBDocument, totalVersions: number }>()
  for (const id of artifactIds) {
    const meta = await getDocumentById({ id })
    if (meta) {
      artifactMetadata.set(id, meta)
    }
  }

  const enrichedMessages = messages.map(message => {
    if (!message.parts) {
      return message
    }

    const newParts = message.parts.map(part => {
      // @ts-ignore
      if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
        // @ts-ignore
        const result = part.toolInvocation.result as any
        const freshMeta = result && result.id ? artifactMetadata.get(result.id) : undefined

        if (freshMeta) {
          const enrichedResult = {
            ...result,
            title: freshMeta.doc.title,
            totalVersions: freshMeta.totalVersions,
            lastVersionAuthorId: freshMeta.doc.authorId
          }
          // @ts-ignore
          return { ...part, toolInvocation: { ...part.toolInvocation, result: enrichedResult } }
        }
      }
      return part
    })

    return { ...message, parts: newParts }
  })

  return enrichedMessages as CoreMessage[]
}

function getContextFromHistory (messages: PostRequestBody['messages']): ArtifactContext | undefined {
  // Итерируемся в обратном порядке
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.parts) {
      for (const part of message.parts) {
        // @ts-ignore
        if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
          // @ts-ignore
          const { toolName, result } = part.toolInvocation
          if (result && result.id && ['createDocument', 'updateDocument', 'getDocument'].includes(toolName)) {
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
  let requestBody: PostRequestBody

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
  } catch (error) {
    console.error('[DEBUG] #3 API error:', error)
    return new ChatSDKError('bad_request:api').toResponse()
  }

  try {
    const {
      id,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      activeArtifactId,
      activeArtifactTitle,
      activeArtifactKind
    } = requestBody

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse()
    }

    const userType: UserType = session.user.type
    const latestMessage = messages.at(-1)

    if (!latestMessage) {
      return new ChatSDKError('bad_request:api', 'No message found in request.').toResponse()
    }

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    })

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse()
    }

    const chat = await getChatById({ id })

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: latestMessage as UIMessage,
      })

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      })
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse()
      }
    }

    const { longitude, latitude, city, country } = geolocation(request)

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    }

    // Определяем контекст артефакта
    let artifactContext: ArtifactContext | undefined =
      activeArtifactId && activeArtifactTitle && activeArtifactKind
        ? { id: activeArtifactId, title: activeArtifactTitle, kind: activeArtifactKind }
        : getContextFromHistory(messages)

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: latestMessage.id,
          role: 'user',
          parts: latestMessage.parts ?? [{ type: 'text', text: latestMessage.content }],
          attachments: latestMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    })

    const streamId = generateUUID()
    await createStreamId({ streamId, chatId: id })

    const enrichedMessages = await enrichMessagesWithArtifacts(messages)

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
          messages: enrichedMessages,
          maxSteps: 6,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
                'getDocument'
              ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            getDocument,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                })

                if (!assistantId) {
                  console.log('onFinish: Error, no assistantId')
                  throw new Error('No assistant message found!')
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [latestMessage as Message],
                  responseMessages: response.messages,
                })

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
                })
              } catch (error) {
                console.error('Failed to save chat', error)
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        })

        result.consumeStream()

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        })
      },
      onError: (error) => {
        console.error('[DEBUG] #1 API error:', error)
        return 'Oops, an error occurred!'
      },
    })

    const streamContext = getStreamContext()

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      )
    } else {
      return new Response(stream)
    }
  } catch (error) {
    console.error('[DEBUG] #2 API error:', error)

    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
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

  const emptyDataStream = createDataStream({
    execute: () => {},
  })

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
