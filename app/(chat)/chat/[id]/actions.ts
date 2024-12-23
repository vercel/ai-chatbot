'use server'

import { User } from '@/lib/types'
import { kv } from '@vercel/kv'

export async function getUser(email: string) {
    const user = await kv.hgetall<User>(`user:${email}`)
    return user
}