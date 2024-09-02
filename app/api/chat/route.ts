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
    system: 'You are a helpful assistant.',
    messages: convertToCoreMessages(messages)
  })

  return result.toAIStreamResponse()
}
