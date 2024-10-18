import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const geminiRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  analytics: true,
  prefix: 'gemini_ratelimit'
})

function getIP() {
  return headers().get('x-real-ip') ?? 'unknown'
}

export async function rateLimit() {
  const limit = await geminiRatelimit.limit(getIP())
  if (!limit.success) {
    redirect('/waiting-room')
  }
}