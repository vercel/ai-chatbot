'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { getSupabaseClient } from '@/lib/utils'

const supabase = getSupabaseClient()

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const {data: chats, error} = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return chats as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {

  const {data: chat, error} = await supabase.from('chats').select('*').eq('id', id).eq('user_id', userId).single()

  if (!chat || (userId && chat.user_id !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id }: { id: string }) {
  // const session = await auth()

  // if (!session) {
  //   return {
  //     error: 'Unauthorized'
  //   }
  // }
  // // supabase query to remove id

  // revalidatePath('/')
  // return revalidatePath(id)
}

export async function clearChats() {
  // const session = await auth()

  // if (!session?.user?.id) {
  //   return {
  //     error: 'Unauthorized'
  //   }
  // }

  // const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  // if (!chats.length) {
  //   return redirect('/')
  // }
  // const pipeline = kv.pipeline()

  // for (const chat of chats) {
  //   pipeline.del(chat)
  //   pipeline.zrem(`user:chat:${session.user.id}`, chat)
  // }

  // await pipeline.exec()

  // revalidatePath('/')
  // return redirect('/')
}

export async function getSharedChat(id: string) {
  // const chat = await kv.hgetall<Chat>(`chat:${id}`)

  // if (!chat || !chat.sharePath) {
  //   return null
  // }

  // return chat
}

export async function shareChat(id: string) {
  // const session = await auth()

  // if (!session?.user?.id) {
  //   return {
  //     error: 'Unauthorized'
  //   }
  // }

  // const chat = await kv.hgetall<Chat>(`chat:${id}`)

  // if (!chat || chat.userId !== session.user.id) {
  //   return {
  //     error: 'Something went wrong'
  //   }
  // }

  // const payload = {
  //   ...chat,
  //   sharePath: `/share/${chat.id}`
  // }

  // await kv.hmset(`chat:${chat.id}`, payload)

  // return payload
}
