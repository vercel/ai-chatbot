import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

import { nanoid } from '@/lib/utils'
import { ChatCompletionRequestMessage } from 'openai-edge/types/types/chat'

export const runtime = 'edge'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken, userId, id }: { messages: Array<ChatCompletionRequestMessage>, previewToken: string, userId: string, id: string} = json
  
  let prompt: ChatCompletionRequestMessage = {
    role: "system",
    content: "I'm high tide weed game character, The game is about weed and funny stuff"
  }
  
  if (id.toLowerCase() == "jake") {
    prompt.content = "Your name is Jake, his Girlfriend is Helani, He is a weed loving chill guy, He usually respond with funny messages"
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      prompt,
      ...messages
    ],
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const id = json.id ?? nanoid()
      const title = json.messages[0].content.substring(0, 100)
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
      await kv.hmset(`chat:${userId}-${id}`, payload)
      // await kv.zadd(`user:chat:${userId}`, {
      //   score: createdAt,
      //   member: `chat:${id}`
      // })
    }
  })

  return new StreamingTextResponse(stream)
}
