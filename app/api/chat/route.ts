import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { z } from 'zod'
import { zValidateReq } from '@/lib/validate'
import { envs } from '@/constants/envs'

export const runtime = 'edge'

const schema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      content: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      name: z.string().optional()
    })
  ),
  previewToken: z.string().nullable().optional(),
  model: z.object({
    id: z.string()
  })
})

export async function POST(req: Request) {
  const {
    id: chatId,
    messages,
    previewToken,
    model
  } = await zValidateReq(schema, req)
  const session = await auth()

  if (process.env.VERCEL_ENV !== 'preview') {
    if (session == null) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const configuration = new Configuration({
    apiKey: previewToken || envs.OPENAI_API_KEY
  })

  const openai = new OpenAIApi(configuration)

  const res = await openai.createChatCompletion({
    model: model.id || 'gpt-3.5-turbo',
    messages,
    temperature: 0.5,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = messages[0].content.substring(0, 100)
      const userId = session?.user.id
      if (userId) {
        const id = chatId ?? nanoid()
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
    }
  })

  return new StreamingTextResponse(stream)
}
