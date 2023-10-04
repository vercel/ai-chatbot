import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs'
import type { User } from '@clerk/nextjs/api'
import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'

export const runtime = 'edge'
export const preferredRegion = 'home'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const user: User | null = await currentUser()

  if (!user) {
    return {}
  }

  const chat = await getChat(params.id, user.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user: User | null = await currentUser()

  if (!user) {
    redirect(`/sign-in?next=/chat/${params.id}`)
  }

  const chat = await getChat(params.id, user.id)

  if (!chat) {
    notFound()
  }

  if (chat?.userId !== user?.id) {
    notFound()
  }

  return <Chat id={chat.id} initialMessages={chat.messages} />
}
