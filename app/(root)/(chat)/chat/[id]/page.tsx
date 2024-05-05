import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getChat, getMissingKeys } from '@/app/(root)/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { getCurrentUser } from '@/lib/user.actions'
import { currentUser } from '@clerk/nextjs'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const user = await currentUser()

  if (!user) {
    return {}
  }

  const chat = await getChat(params.id, user.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await currentUser()
  if (!user) return null
  const userInfo = await getCurrentUser(user.id)
  if (!userInfo.onboarded) redirect('/onboarding')
  const missingKeys = await getMissingKeys()

  const chat = await getChat(params.id, userInfo.id)

  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== userInfo?.id) {
    notFound()
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
      <Chat
        id={chat.id}
        user={userInfo}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
