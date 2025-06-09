/**
 * @file app/api/chat/route.ts
 * @description API маршрут для обработки запросов чата, переписанный под новую архитектуру.
 * @version 4.1.0
 * @date 2025-06-09
 * @updated Исправлены ошибки типизации и вызов toAIStreamResponse.
 */

/** HISTORY:
 * v4.1.0 (2025-06-09): Исправлены ошибки типизации и toAIStreamResponse.
 * v4.0.0 (2025-06-09): Полный рефакторинг под новую архитектуру.
 */

import {
  appendResponseMessages,
  type CoreMessage,
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
import { deleteChatSoftById, getChatById, getMessageCountByUserId, saveChat, saveMessages, } from '@/lib/db/queries'
import { generateUUID } from '@/lib/utils'
import { generateTitleFromUserMessage } from '@/app/(main)/chat/actions'
import { artifactCreate } from '@/lib/ai/tools/artifactCreate'
import { artifactUpdate } from '@/lib/ai/tools/artifactUpdate'
import { artifactEnhance } from '@/lib/ai/tools/artifactEnhance'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { artifactContent } from '@/lib/ai/tools/artifactContent'
import { artifactDelete } from '@/lib/ai/tools/artifactDelete'
import { artifactRestore } from '@/lib/ai/tools/artifactRestore'
import { myProvider } from '@/lib/ai/providers'
import { entitlementsByUserType } from '@/lib/ai/entitlements'
import { type PostRequestBody, postRequestBodySchema } from './schema'
import { geolocation } from '@vercel/functions'
import { ChatSDKError } from '@/lib/errors'
import { createLogger } from '@fab33/sys-logger'

const parentLogger = createLogger('api:chat:route')

export const maxDuration = 60

async function transformToCoreMessages (uiMessages: UIMessage[]): Promise<CoreMessage[]> {
  const logger = parentLogger.child({ function: 'transformToCoreMessages' })
  logger.trace({ messagesCount: uiMessages.length }, 'Entering transformToCoreMessages')
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
          // @ts-ignore
          switch (part.type) {
            case 'text':
              assistantContentParts.push(part)
              break
            case 'tool-invocation': {
              const { state, toolCallId, toolName, args, result } = part.toolInvocation
              if (state === 'call') {
                assistantContentParts.push({ type: 'tool-call', toolCallId, toolName, args })
              } else if (state === 'result') {
                toolResultParts.push({ type: 'tool-result', toolCallId, toolName, result })
              }
              break
            }
          }
        }

        if (assistantContentParts.length > 0) coreMessages.push({ role: 'assistant', content: assistantContentParts })
        if (toolResultParts.length > 0) coreMessages.push({ role: 'tool', content: toolResultParts })
        break
      }

      case 'system':
      case 'data':
      case 'tool':
        coreMessages.push(uiMessage as CoreMessage)
        break
    }
  }
  logger.trace({ coreMessagesCount: coreMessages.length }, 'Exiting transformToCoreMessages')
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
          if (result?.artifactId && ['artifactCreate', 'artifactUpdate', 'artifactContent'].includes(toolName)) {
            return { id: result.artifactId, title: result.artifactTitle, kind: result.artifactKind }
          }
        }
      }
    }
  }
  return undefined
}

export async function POST (request: Request) {
  const logger = parentLogger.child({ requestId: generateUUID(), method: 'POST' })
  logger.trace('Entering POST /api/chat')
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
    } = requestBody
    const session = await auth()
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse()
    }
    const childLogger = logger.child({ chatId, userId: session.user.id })
    const latestMessage = messages.at(-1)
    if (!latestMessage) {
      throw new ChatSDKError('bad_request:api', 'No message found in request.')
    }
    const messageCount = await getMessageCountByUserId({ id: session.user.id, differenceInHours: 24 })
    if (messageCount > entitlementsByUserType[session.user.type as UserType].maxMessagesPerDay) {
      throw new ChatSDKError('rate_limit:chat')
    }

    const chat = await getChatById({ id: chatId })
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: latestMessage as UIMessage })
      await saveChat({ id: chatId, userId: session.user.id, title, visibility: selectedVisibilityType })
    } else if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat')
    }

    const { longitude, latitude, city, country } = geolocation(request)
    const requestHints: RequestHints = { longitude, latitude, city, country }
    const artifactContext = activeArtifactId && activeArtifactTitle && activeArtifactKind
      ? { id: activeArtifactId, title: activeArtifactTitle, kind: activeArtifactKind }
      : getContextFromHistory(messages)

    await saveMessages({
      messages: [{
        chatId,
        id: latestMessage.id,
        role: 'user',
        parts: latestMessage.parts ?? [{ type: 'text', text: latestMessage.content }],
        attachments: latestMessage.experimental_attachments ?? [],
        createdAt: new Date(),
      }]
    })

    const coreMessagesForModel = await transformToCoreMessages(messages as UIMessage[])

    childLogger.info('Starting text stream with AI model')
    const result = await streamText({
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
      messages: coreMessagesForModel,
      maxSteps: 6,
      tools: {
        getWeather,
        artifactContent,
        artifactCreate: artifactCreate({ session }),
        artifactUpdate: artifactUpdate({ session }),
        artifactEnhance: artifactEnhance({ session }),
        artifactDelete: artifactDelete({ session }),
        artifactRestore: artifactRestore({ session }),
      },
      onFinish: async ({ response }) => {
        childLogger.info('Text stream finished, saving assistant response')
        const [, assistantMessage] = appendResponseMessages({
          messages: [latestMessage as Message],
          responseMessages: response.messages
        })
        await saveMessages({
          messages: [{
            id: generateUUID(), chatId, role: assistantMessage.role, parts: assistantMessage.parts,
            attachments: assistantMessage.experimental_attachments ?? [], createdAt: new Date(),
          }]
        })
      },
    })

    return result.toAIStreamResponse()

  } catch (error) {
    logger.error({ err: error as Error }, 'Failed to process chat POST request')
    if (error instanceof ChatSDKError) return error.toResponse()
    return new ChatSDKError('bad_request:api', 'Failed to process request.').toResponse()
  }
}

export async function DELETE (request: Request) {
  const logger = parentLogger.child({ method: 'DELETE' })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new ChatSDKError('bad_request:api').toResponse()

  const session = await auth()
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse()
  }

  const deletedChat = await deleteChatSoftById({ id, userId: session.user.id })
  logger.info('Chat soft-deleted successfully')
  return Response.json(deletedChat, { status: 200 })
}

// END OF: app/api/chat/route.ts
