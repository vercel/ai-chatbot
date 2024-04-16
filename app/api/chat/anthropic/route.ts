import { saveChatMessage } from '@/app/actions'
import { AnthropicStream, StreamingTextResponse, type Message } from 'ai'
import Anthropic from '@anthropic-ai/sdk'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { ChatSettings } from '@/types'
import { CHAT_SETTING_LIMITS } from '@/lib/chat-setting-limits'
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
    // Instantiate Anthropic with either the previewToken or the default API key, Anthropic is compatible with the OpenAI SDK
    const anthropic = new Anthropic({
      apiKey: previewToken || process.env.ANTHROPIC_API_KEY || ''
    })

    const preparedMessages = compileSessionWithTokenManagement(
      {
        chatSettings,
        messages
      },
      userName
    )

    let ANTHROPIC_FORMATTED_MESSAGES: any = preparedMessages.slice(1)

    const res = await anthropic.messages.create({
      model: chatSettings?.model,
      messages: ANTHROPIC_FORMATTED_MESSAGES,
      temperature: chatSettings?.temperature || 0.7,
      system: messages[0].content,
      max_tokens:
        CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH,
      stream: true
    })

    const stream = AnthropicStream(res, {
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
      errorMessage = 'Anthropic API Key not found.'
    } else if (errorCode === 401) {
      errorMessage = 'Anthropic API Key is incorrect.'
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
