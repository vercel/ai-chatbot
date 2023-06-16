'use server'

import { revalidatePath } from 'next/cache'
import { kv } from '@vercel/kv'

import { type Chat } from '@/lib/types'
import { currentUser } from '@clerk/nextjs'
import { nanoid } from '@/lib/utils'

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
  const user = await currentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')
  if (uid !== user.id) {
    throw new Error('Unauthorized')
  }
  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${user.id}`, `chat:${id}`)

  revalidatePath('/')
  revalidatePath(path)
}

export async function clearChats() {
  const user = await currentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const chats: string[] = await kv.zrange(`user:chat:${user.id}`, 0, -1, {
    rev: true
  })

  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
}

export async function shareChat(chat: Chat) {
  const user = await currentUser()

  if (!user || chat.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  const id = nanoid()
  const createdAt = Date.now()

  const payload = {
    id,
    title: chat.title,
    userId: user.id,
    createdAt,
    path: `/share/${id}`,
    chat
  }

  await kv.hmset(`share:${id}`, payload)
  await kv.zadd(`user:share:${user.id}`, {
    score: createdAt,
    member: `share:${id}`
  })

  return payload
}
