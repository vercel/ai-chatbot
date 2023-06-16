import { type Metadata } from 'next'
import { auth } from '@clerk/nextjs'

import { Chat } from '@/components/chat'
import { getChat, getSharedChat } from '@/app/actions'
import { notFound } from 'next/navigation'

// export const runtime = 'edge'
export const preferredRegion = 'home'

export interface SharePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: SharePageProps): Promise<Metadata> {
  const { user } = await auth()
  const chat = await getChat(params.id, user?.id ?? '')
  return {
    title: chat?.title.slice(0, 50) ?? 'Chat'
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id)

  if (!chat || !chat?.sharePath) {
    notFound()
  }

  return <Chat id={chat.id} initialMessages={chat.messages} />
}
