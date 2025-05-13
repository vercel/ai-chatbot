import {
  type Message,
  createDataStream,
  createDataStreamResponse,
  formatDataStreamPart,
  smoothStream,
  streamText
} from 'ai'
import { ChatOpenAI } from '@langchain/openai'
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
import { ThreadState, Client } from '@langchain/langgraph-sdk'
import { LangGraphAdapter } from '@/lib/langgraph_adapter'
import { LangGraphStreamCallbacks } from '@/lib/langgraph_adapter/types'

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

  console.log('Starting the model...')
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
    apiKey: process.env.LANGGRAPH_API_KEY
  })
  console.log('Client created...')
  // get default assistant
  const assistants = await client.assistants.search()
  //console.log(assistants)
  let assistant = assistants.find((a) => a.graph_id === 'agent')
  if (!assistant) {
    assistant = await client.assistants.create({
      graphId: 'agent'
    })
    // throw new Error('No assistant found')
  }
  // create thread
  const thread = await client.threads.create()
  const threadId = thread['thread_id']
  console.log('Thread: ', thread)

  const input = {
    messages: [userMessage]
  }

  const streamResponse = client.runs.stream(
    thread['thread_id'],
    assistant['assistant_id'],
    {
      input,
      streamMode: 'messages'
    }
  )

  const streamCallbacks: LangGraphStreamCallbacks = {
    onStart: (messageId) => {
      console.log(
        `Stream started with message ID: ${messageId} for thread ${threadId}`
      )
    },
    onToken: (token) => {
      // For performance reasons, token logging is commented out
      // console.log(`Token received: ${token}`);
    },
    onError: (error) => {
      console.error(`Stream error occurred:`, error)
    },
    onFinish: async (stats) => {
      console.log(`Stream finished with reason: ${stats.finishReason}`)
      console.log(`Usage stats:`, stats.usage)

      // Just log the thread ID and fetch the thread state
    }
  }

  // Pass the required parameters to access thread data in callbacks
  return LangGraphAdapter.toDataStreamResponse(
    streamResponse,
    streamCallbacks,
    threadId,
    client
  )

  // const soneto = `
  //   Oh Marte rojo, astro de aridez,
  //   Desierto eterno bajo el cielo frío,
  //   Tu rostro escarlata es un desafío,
  //   Un sueño antiguo de la humanidad es.

  //   Tus cañones vastos cuentan su vejez,
  //   Y tus montañas hablan de heroísmo,
  //   Mas tu silencio guarda un abismo,
  //   Un eco mudo de lo que tal vez fue.

  //   Oh Marte, promesa de un futuro audaz,
  //   Tu polvo rojo clama por pisadas,
  //   Por huellas nuevas en tu soledad.

  //   Que el hombre, en busca de tierras soñadas,
  //   Haga de ti su hogar, su nuevo Edén,
  //   Y en tus arenas grabe su vaivén.
  // `

  // const stream = createDataStream({
  //   async execute(dataStream) {
  //     // Write the message start
  //     dataStream.write(
  //       formatDataStreamPart('start_step', { messageId: generateUUID() })
  //     )

  //     // Split the soneto into words and stream each word with a small delay
  //     const words = soneto.split(/\s+/)
  //     for (const word of words) {
  //       dataStream.write(formatDataStreamPart('text', `${word} `))
  //       // Add a small delay between words (50ms)
  //       await new Promise((resolve) => setTimeout(resolve, 10))
  //     }

  //     // Write the message end
  //     dataStream.write(
  //       formatDataStreamPart('finish_message', {
  //         finishReason: 'stop',
  //         usage: { promptTokens: 55, completionTokens: 20 }
  //       })
  //     )
  //   },
  //   onError: (error: unknown) =>
  //     `Custom error: ${error instanceof Error ? error.message : String(error)}`
  // })

  // // Create the HTTP Response.
  // const responseStream = stream.pipeThrough(new TextEncoderStream())

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

  // const result = streamText({
  //   model: myProvider.languageModel(selectedChatModel),
  //   messages
  // })

  // return result.toDataStreamResponse()

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
