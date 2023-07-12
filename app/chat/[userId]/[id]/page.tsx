import { type Metadata } from 'next'
import { notFound, redirect, useRouter } from 'next/navigation'

import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'
import { Message } from 'ai'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'
export const preferredRegion = 'home'

export interface ChatPageProps {
  params: {
    id: string,
    userId: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  // const session = await auth()
  // // session.user = {
  // //   id: 'abc-adasd',
  // //   name: null,
  // //   image: null,
  // //   email: null
  // // }

  // if (!session?.user) {
  //   return {}
  // }
  //const chat = await getChat(params.id, params.userId)
  return {
    title: 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  // const session = await auth()

  // // session.user = {
  // //   id: 'abc-adasd',
  // //   name: null,
  // //   image: null,
  // //   email: null
  // // }

  // if (!session?.user) {
  //   redirect(`/sign-in?next=/chat/${params.id}`)
  // }

  // let router = useRouter();
  // //const { query } = router;
  // let _userID = router.

  //console.log("route", _userID);
  const chat = await getChat(params.id, params.userId)

  if (!chat) {
    //notFound()
  }

  if (chat != null && chat?.userId !== params.userId) {
    notFound()
  }

  let prompt: Message = {
    id: nanoid(),
    role: "system",
    content: "Your name is Jake, his Girlfriend is Helani, He is a weed loving chill guy, He usually respond with funny messages"
  }
  let messages: Message[] = [];

  if (chat != null) {
    messages = chat.messages
  }

  return <Chat id={params.id} initialMessages={messages} userId={params.userId} />
}
