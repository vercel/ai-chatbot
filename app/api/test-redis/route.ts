import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    await redis.set('foo', 'bar')
    const value = await redis.get('foo')
    console.log(value)
    return NextResponse.json({ value })
  } catch (e) {
    console.log(e)
    return NextResponse.json({ error: e })
  }
}
