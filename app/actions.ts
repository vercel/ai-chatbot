'use server'

import { revalidatePath } from 'next/cache'
import { kv } from '@vercel/kv'

import { type Chat } from '@/lib/types'

export async function getChats(userId: string) {
  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1)

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat) {
    throw new Error('Not found')
  }

  if (userId && chat.userId !== userId) {
    throw new Error('Unauthorized')
  }

  return chat
}

export async function removeChat({
  id,
  path,
  userId
}: {
  id: string
  userId: string
  path: string
}) {
  // @todo next-auth@v5 doesn't work in server actions yet
  // const session = await auth();

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')
  if (uid !== userId) {
    throw new Error('Unauthorized')
  }
  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${userId}`, `chat:${id}`)

  revalidatePath('/')
  revalidatePath('/chat/[id]')
}
