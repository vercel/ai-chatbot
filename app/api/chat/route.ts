import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse, Message } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

interface Payload {
  id: string
  title: string
  userId: string
  createdAt?: number
  updatedAt: number
  path: string
  messages: Message[]
  [key: string]: unknown
}

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const updatedAt = Date.now()
      const path = `/chat/${id}`
      const payload: Payload = {
        id,
        title,
        userId,
        updatedAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      const exists = await kv.exists(`chat:${id}`)
      if (!exists) {
        payload.createdAt = updatedAt
      }
      await kv.hset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: updatedAt,
        member: `chat:${id}`
      })
    }
  })

  return new StreamingTextResponse(stream)
}
