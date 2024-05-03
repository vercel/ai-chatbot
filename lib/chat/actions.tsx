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

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
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
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
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

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    initial: <SpinnerMessage />,
    system: `\
    You are a stock trading conversation bot and you can help users buy stocks, step by step.
    You and the user can discuss stock prices and the user can adjust the amount of stocks they want to buy, or place an order, in the UI.
    
    Messages inside [] means that it's a UI element or a user event. For example:
    - "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
    - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.
    
    If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
    If the user just wants the price, call \`show_stock_price\` to show the price.
    If you want to show trending stocks, call \`list_stocks\`.
    If you want to show events, call \`get_events\`.
    If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.
    
    Besides that, you can also chat with users and do some calculations if needed.`,
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
    tools: {
      listStocks: {
        description: 'List three imaginary stocks that are trending.',
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe('The symbol of the stock'),
              price: z.number().describe('The price of the stock'),
              delta: z.number().describe('The change in price of the stock')
            })
          )
        }),
        generate: async function* ({ stocks }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'listStocks',
                content: JSON.stringify(stocks)
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={stocks} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        generate: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPrice',
                content: JSON.stringify({ symbol, price, delta })
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          numberOfShares: z
            .number()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        generate: async function* ({ symbol, price, numberOfShares = 100 }) {
          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPurchase',
                content: JSON.stringify({
                  symbol,
                  price,
                  numberOfShares
                })
              }
            ]
          })

          return (
            <BotCard>
              <Purchase
                props={{
                  numberOfShares,
                  symbol,
                  price: +price,
                  status: 'requires_action'
                }}
              />
            </BotCard>
          )
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        generate: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'getEvents',
                content: JSON.stringify(events)
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
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
  onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

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
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
