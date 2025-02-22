import {
  type Message,
  createDataStreamResponse,
  formatDataStreamPart,
  smoothStream,
  streamText
} from 'ai'
import { ChatOpenAI } from '@langchain/openai'
import { LangChainAdapter } from 'ai'
import { auth } from '@/app/(auth)/auth'
import { myProvider } from '@/lib/ai/models'
import { systemPrompt } from '@/lib/ai/prompts'
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages
} from '@/lib/db/queries'
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages
} from '@/lib/utils'

import { generateTitleFromUserMessage } from '../../actions'
import { createDocument } from '@/lib/ai/tools/create-document'
import { updateDocument } from '@/lib/ai/tools/update-document'
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { m } from 'framer-motion'
import { Client } from '@langchain/langgraph-sdk'
import { console } from 'inspector'

export const maxDuration = 60

type LangGraphStreamEvent = {
  event: string
  data: any
}

// For simplicity we assume each message chunk is an object with a 'content' property (a string)
type LangGraphAIMessageChunk = {
  content: string
}

// --- 1. Provided Function: Delta Messages Generator ---
async function* deltaMessagesGenerator(
  streamResponse: AsyncGenerator<{ event: string; data: any }, any, any>
): AsyncGenerator<string, void, unknown> {
  let lastOutput = '' // holds the last full accumulated message
  for await (const message of streamResponse) {
    // Process only non-complete messages
    if (message.event !== 'messages/complete') {
      const msg = message.data?.[0]
      if (msg?.content) {
        const current = msg.content
        // Calculate delta (new part of the message)
        const delta = current.substring(lastOutput.length)
        // Update the last seen full text
        lastOutput = current
        if (delta) {
          // Format the delta with text code 0 (using your helper)
          const formatted = formatDataStreamPart('text', delta)
          console.log('Delta message:', formatted)
          yield formatted
        }
      }
    }
  }
}

interface fullDataStreamGeneratorProps {
  streamResponse: AsyncGenerator<LangGraphStreamEvent, any, any>
  messageId?: string
}
// --- 2. Full Data Stream Generator ---
// This async generator wraps deltaMessagesGenerator and emits the additional codes.
async function* fullDataStreamGenerator({
  streamResponse,
  messageId = generateUUID()
}: fullDataStreamGeneratorProps): AsyncGenerator<string, void, unknown> {
  // Yield start event (code "f:").
  const startEvent = formatDataStreamPart('start_step', {
    messageId
  })
  yield startEvent

  // Yield each delta update from the API.
  for await (const delta of deltaMessagesGenerator(streamResponse)) {
    yield delta
  }

  // Yield finish step event (code "e:").
  const finishStepEvent = formatDataStreamPart('finish_step', {
    finishReason: 'stop',
    usage: { promptTokens: 55, completionTokens: 20 },
    isContinued: false
  })
  yield finishStepEvent

  // Yield finish message event (code "d:").
  const finishMessageEvent = formatDataStreamPart('finish_message', {
    finishReason: 'stop',
    usage: { promptTokens: 55, completionTokens: 20 }
  })
  yield finishMessageEvent
}

// --- 3. Convert an Async Generator into a ReadableStream ---
function asyncGeneratorToReadableStream(
  generator: AsyncGenerator<string, any, any>
): ReadableStream<string> {
  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await generator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
    async cancel(reason) {
      if (generator.return) {
        await generator.return(reason)
      }
    }
  })
}

function prepareResponseHeaders(
  headers: HeadersInit | undefined,
  {
    contentType,
    dataStreamVersion
  }: { contentType: string; dataStreamVersion?: 'v1' | undefined }
) {
  const responseHeaders = new Headers(headers ?? {})

  if (!responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', contentType)
  }

  if (dataStreamVersion !== undefined) {
    responseHeaders.set('X-Vercel-AI-Data-Stream', dataStreamVersion)
  }

  return responseHeaders
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json()

  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userMessage = getMostRecentUserMessage(messages)
  console.log('User message:', userMessage)
  console.log('Messages:', messages)
  console.log('id', id)

  if (!userMessage) {
    return new Response('No user message found', { status: 400 })
  }

  const chat = await getChatById({ id })

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage })
    await saveChat({ id, userId: session.user.id, title })
  }

  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }]
  })

  const result = streamText({
    model: myProvider.languageModel(selectedChatModel),
    messages
  })

  return result.toDataStreamResponse()

  // const llm = new ChatOpenAI({
  //   apiKey: process.env.OPENAI_API_KEY,
  //   modelName: 'gpt-4o-mini' // context window 128k
  // })

  // const formattedMessages = messages.map((message) => ({
  //   ...message,
  //   type: message.role // assuming 'role' is the equivalent of 'type'
  // }))
  // const result = await llm.stream(formattedMessages)
  // console.log('\nGenerating stream: ', result, '\n')
  // return LangChainAdapter.toDataStreamResponse(result)

  // return createDataStreamResponse({
  //   execute: (dataStream) => {
  //     const result = streamText({
  //       model: myProvider.languageModel(selectedChatModel),
  //       system: systemPrompt({ selectedChatModel }),
  //       messages,
  //       maxSteps: 5,
  //       experimental_activeTools:
  //         selectedChatModel === 'chat-model-reasoning'
  //           ? []
  //           : [
  //               'getWeather',
  //               'createDocument',
  //               'updateDocument',
  //               'requestSuggestions',
  //             ],
  //       experimental_transform: smoothStream({ chunking: 'word' }),
  //       experimental_generateMessageId: generateUUID,
  //       tools: {
  //         getWeather,
  //         createDocument: createDocument({ session, dataStream }),
  //         updateDocument: updateDocument({ session, dataStream }),
  //         requestSuggestions: requestSuggestions({
  //           session,
  //           dataStream,
  //         }),
  //       },
  //       onFinish: async ({ response, reasoning }) => {
  //         if (session.user?.id) {
  //           try {
  //             const sanitizedResponseMessages = sanitizeResponseMessages({
  //               messages: response.messages,
  //               reasoning,
  //             });

  //             await saveMessages({
  //               messages: sanitizedResponseMessages.map((message) => {
  //                 return {
  //                   id: message.id,
  //                   chatId: id,
  //                   role: message.role,
  //                   content: message.content,
  //                   createdAt: new Date(),
  //                 };
  //               }),
  //             });
  //           } catch (error) {
  //             console.error('Failed to save chat');
  //           }
  //         }
  //       },
  //       experimental_telemetry: {
  //         isEnabled: true,
  //         functionId: 'stream-text',
  //       },
  //     });

  //     result.mergeIntoDataStream(dataStream, {
  //       sendReasoning: true,
  //     });
  //   },
  //   onError: () => {
  //     return 'Oops, an error occured!';
  //   },
  // });

  // console.log('Starting the model...')
  // const client = new Client({ apiUrl: 'http://localhost:2024' })
  // console.log('Client created...')
  // // get default assistant
  // const assistants = await client.assistants.search()
  // //console.log(assistants)
  // let assistant = assistants.find((a) => a.graph_id === 'researcher')
  // if (!assistant) {
  //   assistant = await client.assistants.create({ graphId: 'researcher' })
  //   // throw new Error('No assistant found')
  // }
  // // create thread
  // const thread = await client.threads.create()
  // console.log('Thread: ', thread)

  // const input = {
  //   messages: [userMessage]
  // }

  // const streamResponse = client.runs.stream(
  //   thread['thread_id'],
  //   assistant['assistant_id'],
  //   {
  //     input,
  //     streamMode: 'messages'
  //   }
  // )

  // console.log('\nStreaming response...\n\n')
  // // Create our full data stream generator (start, delta, finish events).
  // const fullGenerator = fullDataStreamGenerator({
  //   streamResponse
  // })
  // // Convert it into a ReadableStream of strings.
  // const readableStream = asyncGeneratorToReadableStream(fullGenerator)
  // // Pipe through a TextEncoderStream so the body is binary.
  // const responseStream = readableStream.pipeThrough(new TextEncoderStream())

  // // Create the HTTP Response.
  // const response = new Response(responseStream, {
  //   status: 200,
  //   statusText: 'OK',
  //   headers: prepareResponseHeaders(
  //     {},
  //     {
  //       contentType: 'text/plain; charset=utf-8',
  //       dataStreamVersion: 'v1'
  //     }
  //   )
  // })
  // return response

  // if (!response.body) {
  //   throw new Error('Response body is null')
  // }
  // const reader = response.body.getReader()
  // const decoder = new TextDecoder('utf-8')
  // let result = ''

  // while (true) {
  //   const { done, value } = await reader.read()
  //   if (done) break
  //   const textChunk = decoder.decode(value, { stream: true })
  //   console.log('Received chunk:', textChunk)
  //   result += textChunk
  // }
  // result += decoder.decode() // flush remaining bytes
  // console.log('Full response:', result)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new Response('Not Found', { status: 404 })
  }

  const session = await auth()

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const chat = await getChatById({ id })

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    await deleteChatById({ id })

    return new Response('Chat deleted', { status: 200 })
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500
    })
  }
}

// const result = streamText({
//     model: myProvider.languageModel(selectedChatModel),
//     messages
//   })

//   const response = result.toDataStreamResponse()

//   if (!response.body) {
//     throw new Error('Response body is null')
//   }
//   const reader = response.body.getReader()
//   const decoder = new TextDecoder('utf-8')
//   let fullText = ''
//   while (true) {
//     const { done, value } = await reader.read()
//     if (done) break
//     const chunkText = decoder.decode(value, { stream: true })
//     console.log('Received chunk:', chunkText)
//     fullText += chunkText
//   }
//   fullText += decoder.decode() // flush remaining bytes
//   console.log('Full response stream:', fullText)
//   return response
// }
