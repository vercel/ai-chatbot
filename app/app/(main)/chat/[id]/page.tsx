// app/(main)/chat/[id]/page.tsx

/**
 * @file app/(main)/chat/[id]/page.tsx
 * @description Страница отображения конкретного чата.
 * @version 1.2.0
 * @date 2025-06-11
 * @updated Добавлено логирование для некорректных данных сообщений.
 */

/** HISTORY:
 * v1.2.0 (2025-06-11): Добавлено логирование.
 * v1.1.0 (2025-06-09): Удален компонент DataStreamHandler.
 */
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/app/app/(auth)/auth'
import { Chat } from '@/components/chat'
import { getChatById, getMessagesByChatId } from '@/lib/db/queries'
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'
import type { DBMessage } from '@/lib/db/schema'
import type { Attachment, UIMessage } from 'ai'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('page:chat:[id]')

function convertToUIMessages (messages: Array<DBMessage>, chatId: string): Array<UIMessage> {
  return messages.map((message) => {
    let parts: UIMessage['parts'] = []
    if (Array.isArray(message.parts)) {
      parts = message.parts as UIMessage['parts']
    } else {
      logger.warn(
        { chatId, messageId: message.id, partsData: message.parts },
        'Поле \'parts\' в сообщении не является массивом. Используется пустой массив. Это может указывать на проблему с целостностью данных для старых сообщений.'
      )
      parts = []
    }

    let attachments: Array<Attachment> = []
    if (Array.isArray(message.attachments)) {
      attachments = message.attachments as Array<Attachment>
    } else {
      logger.warn(
        { chatId, messageId: message.id, attachmentsData: message.attachments },
        'Поле \'attachments\' в сообщении не является массивом. Используется пустой массив.'
      )
      attachments = []
    }

    return {
      id: message.id,
      parts: parts,
      role: message.role as UIMessage['role'],
      content: '', // content теперь deprecated
      createdAt: message.createdAt,
      experimental_attachments: attachments,
    }
  })
}

export default async function Page (props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params
  const chat = await getChatById({ id })

  if (!chat) {
    notFound()
  }

  const session = await auth()

  if (!session) {
    redirect('/api/auth/guest')
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound()
    }

    if (session.user.id !== chat.userId) {
      return notFound()
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  })

  // Передаем ID чата в функцию для более детального логирования
  const initialMessages = convertToUIMessages(messagesFromDb, id)

  const cookieStore = await cookies()
  const chatModelFromCookie = cookieStore.get('chat-model')

  return (
    <Chat
      id={chat.id}
      initialMessages={initialMessages}
      initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
      isReadonly={session?.user?.id !== chat.userId}
      session={session}
      autoResume={true}
    />
  )
}

// END OF: app/(main)/chat/[id]/page.tsx
