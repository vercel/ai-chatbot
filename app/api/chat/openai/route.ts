import { saveChatMessage } from '@/app/actions'
import {
  OpenAIStream,
  StreamingTextResponse,
  type Message,
  type JSONValue
} from 'ai'
import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { ChatSettings } from '@/types'
import { compileSessionWithTokenManagement } from '@/lib/build-prompt'

const tools: ChatCompletionTool[] = [
  {
    function: {
      name: 'get_current_weather',
      description: 'Get the current weather',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA'
          },
          format: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description:
              'The temperature unit to use. Infer this from the users location.'
          }
        },
        required: ['location', 'format']
      }
    },
    type: 'function'
  },
  {
    function: {
      name: 'eval_code_in_browser',
      description: 'Execute javascript code in the browser with eval().',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: `Javascript code that will be directly executed via eval(). Do not use backticks in your response.
           DO NOT include any newlines in your response, and be sure to provide only valid JSON when providing the arguments object.
           The output of the eval() will be returned directly by the function.`
          }
        },
        required: ['code']
      }
    },
    type: 'function'
  },
  {
    function: {
      name: 'create_image',
      description: 'Create an image for the given description',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of what the image should be.'
          }
        },
        required: ['description']
      }
    },
    type: 'function'
  }
]

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
    // Instantiate OpenAi with either the previewToken or the default API key
    const openai = new OpenAI({
      apiKey: previewToken || process.env.OPENAI_API_KEY || ''
    })

    const preparedMessages = compileSessionWithTokenManagement(
      {
        chatSettings,
        messages
      },
      userName
    )

    const toolsData: JSONValue[] = []
    const res = await openai.chat.completions.create({
      model:
        chatSettings?.model || (process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo'),
      messages: preparedMessages,
      temperature: chatSettings?.temperature || 0.7,
      max_tokens: chatSettings?.model === 'gpt-4-vision-preview' ? 4096 : null,
      stream: true,
      tools,
      tool_choice: 'auto'
    })

    const stream = OpenAIStream(res, {
      async experimental_onToolCall(toolCallPayload, appendToolCallMessage) {
        let messages: any[] = []
        for (const tool of toolCallPayload.tools) {
          const { id, type, func } = tool

          if (type === 'function') {
            const { name, arguments: args } = func
            const parsedArgs = JSON.parse(args as unknown as string)

            switch (name) {
              case 'get_current_weather': {
                const { location, format } = parsedArgs
                // Fake function call result:
                const result = {
                  tool_call_id: id,
                  function_name: 'get_current_weather',
                  tool_call_result: {
                    type: 'weather',
                    location: location as string,
                    format: format as string,
                    temperature: Math.floor(Math.random() * 60) - 20
                  }
                }

                toolsData.push(result.tool_call_result)
                appendToolCallMessage(result)
                break
              }

              case 'create_image': {
                const { description } = parsedArgs

                // Generate image
                const response = await openai.images.generate({
                  model: 'dall-e-2',
                  prompt: `${description}`,
                  size: '256x256',
                  response_format: 'url'
                })

                const result = {
                  tool_call_id: id,
                  function_name: 'create_image',
                  tool_call_result: {
                    type: 'image',
                    url: response.data[0].url!
                  }
                }

                toolsData.push(result.tool_call_result)
                appendToolCallMessage(result)
                break
              }
            }
          }
        }
        return await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo',
          stream: true,
          messages: [...messages, ...appendToolCallMessage()]
        })
      },
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
          completion,
          toolsData
        )
      }
    })

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || 'An unexpected error occurred'
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes('api key not found')) {
      errorMessage = 'OpenAI API Key not found.'
    } else if (errorMessage.toLowerCase().includes('incorrect api key')) {
      errorMessage = 'OpenAI API Key is incorrect.'
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
