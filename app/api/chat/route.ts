import { createOpenAI } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()
  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
  })

  const result = await streamText({
    model: groq('llama3-8b-8192'),
    system:
      'You are Clara, an AI assistant to learn English. Use your name when asked. The student is the user and will communicate in spanish or a combination with english. Be patient and correct them nicely. You will try to respond in English and then spanish so the user can learn.',
    messages: convertToCoreMessages(messages)
  })

  return result.toAIStreamResponse()
}
