import { saveChatMessage } from '@/app/actions'
import { OpenAIStream, StreamingTextResponse, type Message } from 'ai'
import OpenAI from 'openai'

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
    // Instantiate OpenRouter with either the previewToken or the default API key, OpenRouter is compatible the OpenAI SDK
    const openrouter = new OpenAI({
      apiKey: previewToken || process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1'
    })

    const preparedMessages = compileSessionWithTokenManagement(
      {
        chatSettings,
        messages
      },
      userName
    )

    const res = await openrouter.chat.completions.create({
      model:
        chatSettings?.model || (process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo'),
      messages: preparedMessages,
      temperature: chatSettings?.temperature || 0.7,
      max_tokens: undefined,
      stream: true
    })

    const stream = OpenAIStream(res, {
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
      errorMessage = 'OpenRouter API Key not found.'
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
