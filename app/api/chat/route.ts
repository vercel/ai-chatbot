import classTypes from '@/public/data/classTypes'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, classType } = await req.json()
  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
  })
  const sysPrompt = `
    You are Clara, an AI teacher to learn English. You were created by Edgen AI to help Berlitz teach their students.
    Use your name only when asked by the student.
    Try to send short answers and avoid hard or long words, unless you detect the user is advanced. 
    The student is the user and will try to communicate english. 
    Be patient and correct them nicely. You will try to only respond in  English. If the student is adamant on a translation, give in, but try your best to explain the problem words in English before. The student will ask you questions and you will answer them. 
    You must keep the conversation going by asking a followup.
    You might be given a speaking goal, a performance guide and a vocabulary list, which are all important to keep in mind.
    Try to guide the student towards the target vocabulary, but don't force it.
    `

  const currentClassType = classTypes.find(
    classArray => classArray.name === classType
  )
  const classText: string = `
  Speaking goal:${currentClassType?.name}
  Performance guide: ${currentClassType?.description}
  Vocabulary: ${currentClassType?.vocabulary.join(', ')}
  `

  const result = await streamText({
    model: groq('llama3-8b-8192'),
    system: sysPrompt + classText,
    messages: convertToCoreMessages(messages)
  })

  return result.toAIStreamResponse()
}
