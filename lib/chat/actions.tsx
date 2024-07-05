import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import { Pinecone } from "@pinecone-database/pinecone"

import {
  spinner,
  BotMessage,
  SystemMessage,
} from '@/components/stocks'

import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })  

  // Create input embedding
  const embeddings = await createEmbeddings(content) as number[]

  // Get context from Pinecone
  const context = await getEmbeddingsFromPinecone(embeddings)

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-4o'),
    initial: <SpinnerMessage />,
    system: `\
    You are a jurisprudency analist and you can help users understand legal terms, step by step.
    You and the user can discuss legal terms and the user can ask you to explain the terms.
    Answer always in Brazilian Portuguese.
    Always include references and sources in a table format, if possible.
    
    [CONTEXT: ${context}]

    [Conversation history: ${aiState.get().messages.map((message: any) => message.content).join(' ').slice(0, 1024)}]
    `,
    // If the user asks you to explain a term, call \`explain_term\` to explain the term.
    // If the user asks you to explain a legal concept, call \`explain_concept\` to explain the concept.
    // If the user asks you to explain a legal case, call \`explain_case\` to explain the case.
    
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        // message.role === 'tool' ? (
        //   message.content.map(tool => {
        //     return tool.toolName === 'listStocks' ? (
        //       <BotCard>
        //         {/* TODO: Infer types based on the tool result*/}
        //         {/* @ts-expect-error */}
        //         <Stocks props={tool.result} />
        //       </BotCard>
        //     ) : tool.toolName === 'showStockPrice' ? (
        //       <BotCard>
        //         {/* @ts-expect-error */}
        //         <Stock props={tool.result} />
        //       </BotCard>
        //     ) : tool.toolName === 'showStockPurchase' ? (
        //       <BotCard>
        //         {/* @ts-expect-error */}
        //         <Purchase props={tool.result} />
        //       </BotCard>
        //     ) : tool.toolName === 'getEvents' ? (
        //       <BotCard>
        //         {/* @ts-expect-error */}
        //         <Events props={tool.result} />
        //       </BotCard>
        //     ) : null
        //   })
        // ) : 
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}

const createEmbeddings = async (text: string) => {    
  try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text.replace(/\n/g, ' ')
        })
      });
    
      const result = await response.json();
      if (!result.data) {
        console.error('Error creating embedding:', text);
        return
      }
      return result.data[0].embedding as number[]
  } catch (error) {
      console.log("Error getting embedding ",error)
      throw error
  }
}

const getEmbeddingsFromPinecone = async (vectors: number[]) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    })

    const index = await pinecone.index('lexgpt')
    const namespace = index.namespace('stj')
    const response = await namespace.query({
      vector: vectors,
      topK: 3,
      includeMetadata: true
    })
    return response.matches || []
  } catch (error) {
    console.log("Error getting embeddings from Pinecone ",error)
    throw error
  }
}

//     You are a stock trading conversation bot and you can help users buy stocks, step by step.
//     You and the user can discuss stock prices and the user can adjust the amount of stocks they want to buy, or place an order, in the UI.
    
//     Messages inside [] means that it's a UI element or a user event. For example:
//     - "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
//     - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.
    
//     If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
//     If the user just wants the price, call \`show_stock_price\` to show the price.
//     If you want to show trending stocks, call \`list_stocks\`.
//     If you want to show events, call \`get_events\`.
//     If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.
    
//     Besides that, you can also chat with users and do some calculations if needed.