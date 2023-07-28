import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'
import { cookies } from 'next/headers'

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
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    return {}
  }

  const chat = await getChat(params.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect(`/sign-in?next=/chat/${params.id}`)
  }

  const chat = await getChat(params.id)

  if (!chat) {
    notFound()
  }

  if (chat?.userId !== session?.user?.id) {
    notFound()
  }

  return <Chat id={chat.id} initialMessages={chat.messages} />
}
