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
    Use your name when asked by the student.
    Try to send short answers and avoid hard or long words, unless you detect the user is advanced. 
    The student is the user and will try to communicate english. 
    Be patient and correct them nicely. You will try to only respond in  English. If the student is adamant on a translation, give in, but try your best to explain the problem words in English before. The student will ask you questions and you will answer them. 
    You must keep the conversation going by asking a followup.
    You might be given a speaking goal, a performance guide and a vocabulary list, which are all important to keep in mind.
    Try to guide the student towards the target vocabulary, but don't force it.
    `
  const classTypes: {
    name: string
    vocabulary: string[]
    description: string
  }[] = [
    {
      name: 'Identify important people and places in a hospital',
      vocabulary: [
        'medical',
        'doctor (Dr.)',
        'nurse',
        'surgeon',
        'operating room (OR)',
        'emergency department (ED)'
      ],
      description:
        'Lesson #1: Identify important people and places in a hospital'
    },
    {
      name: 'Describe safety procedures',
      vocabulary: [
        'gloves',
        'washing hands',
        'mask',
        'gown',
        'isolation',
        'to disinfect'
      ],
      description: 'Lesson #2: Describe safety procedures'
    },
    {
      name: 'Communicate a patient’s vital signs with the medical team',
      vocabulary: [
        'weight',
        'temperature',
        'pulse',
        'blood pressure',
        'vital signs',
        'to measure'
      ],
      description:
        'Lesson #3: Communicate a patient’s vital signs with the medical team'
    },
    {
      name: 'Ask about a patient’s medical history',
      vocabulary: [
        'medical history',
        'illness',
        'surgery',
        'habits',
        'allergy',
        'medication'
      ],
      description: 'Lesson #4: Ask about a patient’s medical history'
    },
    {
      name: 'Talk to a patient after an accident',
      vocabulary: ['hurt', 'pain', 'bone', 'fracture', 'sprain', 'treatment'],
      description: 'Lesson #5: Talk to a patient after an accident'
    }
  ]
  const classText: string = `
  Speaking goal:${classTypes[classType].name}
  Performance guide: ${classTypes[classType].description}
  Vocabulary: ${classTypes[classType].vocabulary.join(', ')}
  `

  const result = await streamText({
    model: groq('llama3-8b-8192'),
    system: sysPrompt + classText,
    messages: convertToCoreMessages(messages)
  })

  return result.toAIStreamResponse()
}
