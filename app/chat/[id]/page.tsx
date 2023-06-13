import { type Metadata } from 'next'

import { Chat } from '@/components/chat'
import { getChat } from '@/app/actions'
import { Header } from '@/components/header'
import { auth } from '@clerk/nextjs'

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
    <div className="flex flex-col min-h-screen">
      {/* @ts-ignore */}
      <Header />
      <main className="flex-1 bg-muted/50">
        <Chat id={chat.id} initialMessages={chat.messages} />
      </main>
    </div>
  )
}
