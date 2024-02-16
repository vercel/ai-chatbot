// import { type Metadata } from 'next'
// import { notFound, redirect } from 'next/navigation'

// import { auth } from '@/auth'
// import { getChat } from '@/app/actions'
// import { Chat } from '@/components/chat'

// export interface ChatPageProps {
//   params: {
//     id: string
//   }
// }

// export async function generateMetadata({
//   params
// }: ChatPageProps): Promise<Metadata> {
//   const session = await auth()

//   if (!session?.user) {
//     return {}
//   }

//   const chat = await getChat(params.id, session.user.id)
//   return {
//     title: chat?.title.toString().slice(0, 50) ?? 'Chat'
//   }
// }

// export default async function ChatPage({ params }: ChatPageProps) {
//   const session = await auth()

//   if (!session?.user) {
//     redirect(`/sign-in?next=/chat/${params.id}`)
//   }

//   const chat = await getChat(params.id, session.user.id)

//   if (!chat) {
//     notFound()
//   }

//   if (chat?.userId !== session?.user?.id) {
//     notFound()
//   }

//   return <Chat id={chat.id} initialMessages={chat.messages} />
// }


import { type Metadata } from 'next'

import { getChat } from '@/app/actions'
import { notFound } from 'next/navigation'
import { Chat } from '@/components/chat'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  // Assuming getChat no longer requires a user ID.
  const chat = await getChat(params.id, params.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export interface ChatPageProps {
  params: {
    id: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  // Assuming getChat no longer requires a user ID.
  const chat = await getChat(params.id, params.id)

  if (!chat) {
    notFound()
  }

  // Removed the check for chat.userId vs session?.user?.id since we're not using session anymore.
  
  return <Chat id={chat.id} initialMessages={chat.messages} />
}