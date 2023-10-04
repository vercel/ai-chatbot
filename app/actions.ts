'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Redis } from '@upstash/redis'

import { currentUser } from '@clerk/nextjs'
import type { User } from '@clerk/nextjs/api'
import { type Chat } from '@/lib/types'

const redis = new Redis({
  url: process.env.UPSTASH_URL as string,
  token: process.env.UPSTASH_TOKEN as string
})

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = redis.pipeline()
    const chats: string[] = await redis.zrange(`user:chat:${userId}`, 0, -1, {
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
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const user: User | null = await currentUser()

  if (!user) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await redis.hget<string>(`chat:${id}`, 'userId')

  if (uid !== user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await redis.del(`chat:${id}`)
  await redis.zrem(`user:chat:${user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const user: User | null = await currentUser()

  if (!user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await redis.zrange(`user:chat:${user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = redis.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const user: User | null = await currentUser()

  if (!user?.id || user.id !== chat.userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await redis.hmset(`chat:${chat.id}`, payload)

  return payload
}
