import { type Message, formatDataStreamPart } from 'ai'
import { auth } from '@/app/(auth)/auth'
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages
} from '@/lib/db/queries'
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils'

import { generateTitleFromUserMessage } from '../../actions'
import { createDocument } from '@/lib/ai/tools/create-document'
import { updateDocument } from '@/lib/ai/tools/update-document'
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { m } from 'framer-motion'
import { Client } from '@langchain/langgraph-sdk'
import { console } from 'inspector'
import { LangGraphAdapter } from '@/lib/adapters/LangGraphAdapter'

export const maxDuration = 60

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

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
    apiKey: process.env.LANGGRAPH_API_KEY
  })

  // get default assistant
  const assistants = await client.assistants.search()
  //console.log(assistants)
  let assistant = assistants.find((a) => a.graph_id === 'researcher')
  if (!assistant) {
    assistant = await client.assistants.create({ graphId: 'researcher' })
    // throw new Error('No assistant found')
  }
  // create thread
  const thread = await client.threads.create()

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

  return LangGraphAdapter.toDataStreamResponse(streamResponse)
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
