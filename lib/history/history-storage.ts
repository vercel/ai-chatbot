'use server'

import { auth } from '@/auth'
import { kv } from '@vercel/kv'

const getStorageKey = async () => {
  const session = await auth()
  if (!session?.user) return
  return `history:${session.user.id}`
}

export const listHistory = async () => {
  const storageKey = await getStorageKey()
  if (!storageKey) return []
  return (await kv.get<string[]>(storageKey)) || []
}

export const setHistory = async (values: string[]) => {
  const storageKey = await getStorageKey()
  if (storageKey) {
    await kv.set(storageKey, JSON.stringify(values))
  }
}
