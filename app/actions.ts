'use server'

import { revalidatePath } from 'next/cache'
import { kv } from '@vercel/kv'
import { auth } from '@/auth'

import { type Chat } from '@/lib/types'

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

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

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth<{ stuff: string }>()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid !== session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session) {
    throw new Error('Unauthorized')
  }

  if (!session.user?.id) {
    throw new Error('Unauthorized')
  }

  const chats: string[] = await kv.zrange(
    `user:chat:${session.user.id}`,
    0,
    -1,
    {
      rev: true
    }
  )

  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const session = await auth()

  if (!session) {
    throw new Error('Unauthorized')
  }

  if (!session.user?.id) {
    throw new Error('Unauthorized')
  }

  if (chat.userId !== session.user?.id) {
    throw new Error('Unauthorized')
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}
