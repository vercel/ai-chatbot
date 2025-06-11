/**
 * @file app/api/chat/discuss-artifact/route.ts
 * @description API маршрут для создания чата с контекстом артефакта.
 * @version 1.3.0
 * @date 2025-06-09
 * @updated Адаптирован под новую архитектуру Artifact.
 */

/** HISTORY:
 * v1.3.0 (2025-06-09): Адаптация под Artifact.
 * v1.2.1 (2025-06-06): Исправлена ошибка доступа к свойствам документа.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getArtifactById, saveChat, saveMessages } from '@/lib/db/queries'
import { generateUUID } from '@/lib/utils'
import { ChatSDKError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

const assistantResponses = [
  'Отлично, давайте обсудим. Готов приступать!',
  'Хорошо! Готов к обсуждению. Какие у вас есть вопросы?',
  'Артефакт перед глазами. С чего начнем?',
  'Конечно, давайте поговорим об этом. Что вы хотите узнать?',
]

function getRandomResponse () {
  const randomIndex = Math.floor(Math.random() * assistantResponses.length)
  return assistantResponses[randomIndex]
}

export async function GET (request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'Пользователь не авторизован.').toResponse()
    }

    const { searchParams } = new URL(request.url)
    const artifactId = searchParams.get('artifactId')

    if (!artifactId) {
      return new ChatSDKError('bad_request:api', 'artifactId является обязательным параметром.').toResponse()
    }

    const artifactResult = await getArtifactById({ id: artifactId })
    if (!artifactResult || !artifactResult.doc || artifactResult.doc.userId !== session.user.id) {
      return new ChatSDKError('forbidden:api', 'Артефакт не найден или доступ запрещен.').toResponse()
    }

    const artifact = artifactResult.doc

    const newChatId = generateUUID()
    const newChatTitle = `Обсуждение: ${artifact.title}`

    await saveChat({
      id: newChatId,
      userId: session.user.id,
      title: newChatTitle,
      visibility: 'private',
    })

    const userMessage = {
      id: generateUUID(),
      chatId: newChatId,
      role: 'user',
      parts: [
        { type: 'text', text: 'Давайте обсудим следующий артефакт:' },
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'artifactContent',
            toolCallId: generateUUID(),
            state: 'result',
            args: { artifactId: artifact.id },
            result: {
              artifactId: artifact.id,
              artifactTitle: artifact.title,
              artifactKind: artifact.kind,
              description: `Артефакт "${artifact.title}" добавлен в чат для обсуждения.`,
            },
          }
        }
      ],
      attachments: [],
      createdAt: new Date(),
    }

    const assistantMessage = {
      id: generateUUID(),
      chatId: newChatId,
      role: 'assistant',
      parts: [{ type: 'text', text: getRandomResponse() }],
      attachments: [],
      createdAt: new Date(Date.now() + 1),
    }

    await saveMessages({
      messages: [userMessage, assistantMessage],
    })

    const chatUrl = new URL(`/chat/${newChatId}`, request.url)
    return NextResponse.redirect(chatUrl.toString())

  } catch (error) {
    console.error('SYS_API_DISCUSS_ARTIFACT: Ошибка при создании чата для обсуждения', error)
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:api', 'Не удалось создать чат для обсуждения.').toResponse()
  }
}

// END OF: app/api/chat/discuss-artifact/route.ts
