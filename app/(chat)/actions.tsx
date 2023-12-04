'use server'
import { kv } from '@vercel/kv'
import {
  OpenAIStream,
  experimental_StreamingReactResponse,
  type Message
} from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { ChatCompletionMessageParam } from 'openai/resources'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function handleChat({
  id: _id,
  messages,
  previewToken
}: {
  id: string
  messages: Message[]
  previewToken?: string
}) {
  console.log('messages', messages)
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    openai.apiKey = previewToken
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages.map(m => ({
      content: m.content,
      role: m.role
    })) as ChatCompletionMessageParam[],
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = messages[0].content.substring(0, 100)
      const id = _id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  })

  return new experimental_StreamingReactResponse(stream, {
    ui({ content }) {
      return <div>{content}</div>
    }
  })
}
