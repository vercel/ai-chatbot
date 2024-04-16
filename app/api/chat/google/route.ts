import { saveChatMessage } from '@/app/actions'
import {
  GoogleGenerativeAIStream,
  StreamingTextResponse,
  type Message
} from 'ai'
import { GoogleGenerativeAI } from '@google/generative-ai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { ChatSettings } from '@/types'
import { compileSessionWithTokenManagement } from '@/lib/build-prompt'

export async function POST(req: Request) {
  const json = await req.json()
  const { chatSettings, messages, previewToken } = json as {
    chatSettings: ChatSettings
    messages: any[]
    previewToken: string
  }
  const userId = (await auth())?.user.id
  const userName = (await auth())?.user.name

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  try {
    // Instantiate Google with either the previewToken or the default API key, Google is compatible with the OpenAI SDK
    const google = {
      apiKey: previewToken || process.env.GOOGLE_GEMINI_API_KEY || ''
    }

    const genAI = new GoogleGenerativeAI(google.apiKey)
    const googleModel = genAI.getGenerativeModel({ model: chatSettings.model })

    const preparedMessages = compileSessionWithTokenManagement(
      {
        chatSettings,
        messages
      },
      userName
    )

    const buildGoogleGenAIPrompt = (messages: Message[]) => ({
      contents: messages
        .filter(
          message => message.role === 'user' || message.role === 'assistant'
        )
        .map(message => ({
          role: message.role === 'user' ? 'user' : 'model',
          parts: [{ text: message.content }]
        }))
    })

    const res = await googleModel.generateContentStream(
      buildGoogleGenAIPrompt(preparedMessages)
    )

    const stream = GoogleGenerativeAIStream(res, {
      async onCompletion(completion) {
        const filteredMessages = messages.filter(
          (msg: Message) => !(msg.role === 'system' || msg.role === 'function')
        )
        const title = filteredMessages[0].content.substring(0, 100)
        const id = json.id ?? nanoid()
        const path = `/chat/${id}`

        await saveChatMessage(
          id,
          title,
          userId,
          path,
          filteredMessages,
          completion
        )
      }
    })

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || 'An unexpected error occurred'
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes('api key not found')) {
      errorMessage = 'Google Gemini API Key not found.'
    } else if (errorMessage.toLowerCase().includes('api key not valid')) {
      errorMessage = 'Google Gemini API Key is incorrect.'
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
