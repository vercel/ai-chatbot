/**
 * @file app/(main)/chat/[id]/page.tsx
 * @description Страница отображения конкретного чата.
 * @version 1.1.0
 * @date 2025-06-09
 * @updated Удален компонент DataStreamHandler.
 */

/** HISTORY:
 * v1.1.0 (2025-06-09): Удален DataStreamHandler.
 * v1.0.0 (2025-06-06): Удален неиспользуемый проп `initialVisibilityType`.
 */
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/app/(auth)/auth'
import { Chat } from '@/components/chat'
import { getChatById, getMessagesByChatId } from '@/lib/db/queries'
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'
import type { DBMessage } from '@/lib/db/schema'
import type { Attachment, UIMessage } from 'ai'

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

  function convertToUIMessages (messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      content: '', // content теперь deprecated
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }))
  }

  const cookieStore = await cookies()
  const chatModelFromCookie = cookieStore.get('chat-model')

  return (
    <Chat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
      isReadonly={session?.user?.id !== chat.userId}
      session={session}
      autoResume={true}
    />
  )
}

// END OF: app/(main)/chat/[id]/page.tsx
