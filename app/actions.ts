'use server'

import { kv } from '@vercel/kv'
import { revalidatePath } from 'next/cache'

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
