'use server'

import { User } from '@/lib/types'
import { z } from 'zod'
import { kv } from '@vercel/kv'
import { ResultCode } from '@/lib/utils'

export async function getUser(email: string) {
    const user = await kv.hgetall<User>(`user:${email}`)
    return user
}