import { type Metadata } from 'next'
import { auth } from '@clerk/nextjs'

import { Chat } from '@/components/chat'
import { getChat } from '@/app/actions'
import { Header } from '@/components/header'

// export const runtime = 'edge'
export const preferredRegion = 'home'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const { user } = await auth()
  const chat = await getChat(params.id, user?.id ?? '')
  return {
    title: chat?.title.slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { user } = await auth()
  const chat = await getChat(params.id, user?.id ?? '')

  return (
    <div className="flex min-h-screen flex-col">
      {/* @ts-ignore */}
      <Header />
      <main className="flex-1 bg-muted/50">
        <Chat id={chat.id} initialMessages={chat.messages} />
      </main>
    </div>
  )
}
