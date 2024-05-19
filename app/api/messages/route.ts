import { redis } from '@/lib/redis'
import { NextApiRequest, NextApiResponse } from 'next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: Request, res: Response) {
  const searchParams = new URLSearchParams(req.url)
  const roomId = searchParams.get('http://localhost:3000/api/messages?roomId')

  const roomExists = await redis.exists(`chat:${roomId}`)
  if (!roomExists) {
    return NextResponse.json({ success: false, error: 'Room not found' })
  }

  const messages = await redis.lrange(`chat:${roomId}`, 0, -1)
  const parsedMessages = messages.map(msg => JSON.parse(msg))
  return NextResponse.json({ success: true, messages: parsedMessages })
}

export async function POST(req: Request, res: Response) {
  // const searchParams = new URLSearchParams(req.url)
  // const roomId = searchParams.get('http://localhost:3000/api/messages?roomId')

  // get the message from body of the request
  const body = await req.json()
  const roomId = body.roomId
  const text = body.text
  const from = body.from

  const newMessage = {
    from: from,
    text: text
  }

  await redis.lpush(`chat:${roomId}`, JSON.stringify(newMessage))
  return NextResponse.json({ message: 'Message saved' })
}
