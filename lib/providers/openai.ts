'use server'

import OpenAI from 'openai'
import {
  OpenAIStream,
  experimental_StreamingReactResponse,
  type Message
} from 'ai'
import { type ChatCompletionMessageParam } from 'openai/resources'
import { createChat } from '@/app/actions'
import { auth } from '@/auth'

const OPENAPI_MODEL = 'gpt-3.5-turbo'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function handleChat(
  meta: {
    id?: string
    previewToken: string | null
  },
  {
    messages
  }: {
    messages: Message[]
    data?: Record<string, string>
  }
) {
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (meta.previewToken) {
    openai.apiKey = meta.previewToken
  }

  // Create a streaming chat completion with the messages.
  const response = await openai.chat.completions.create({
    model: OPENAPI_MODEL,
    messages: messages as ChatCompletionMessageParam[],
    temperature: 0.7,
    stream: true
  })

  // Convert response in a text-based stream.
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await createChat({
        id: meta.id,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      })
    }
  })

  // Respond with the stream.
  return new experimental_StreamingReactResponse(stream)
}
