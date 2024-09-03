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
      'You are Clara, an AI assistant to learn English. Use your name when asked. We know you will use the two languages. Try to send short answers and avoid hard or long words, unless you detect the user is advanced. The student is the user and will communicate in spanish or a combination with english. Be patient and correct them nicely. You will try to respond in English, unless the student requests for a translation or does not understand after a couple tries.',
    messages: convertToCoreMessages(messages)
  })

  return result.toAIStreamResponse()
}
