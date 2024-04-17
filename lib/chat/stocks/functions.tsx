import React from 'react'
import { z } from 'zod'
import { BotCard, Purchase, BotMessage, Stock } from '@/components/stocks'
import { sleep, nanoid } from '@/lib/utils'
import { getMutableAIState, render } from 'ai/rsc'

import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import { Message } from '../actions'
let aiResponseMessage: undefined | Message

type TFunctions = Parameters<typeof render>[0]['functions']

type ListStocksInfo = {
  stocks: StockPriceInfo[]
}

type StockPriceInfo = {
  symbol: string
  price: number
  delta: number
}

type StockPurchaseInfo = {
  symbol: string
  price: number
  numberOfShares: number
}

type EventInfo = {
  date: string
  headline: string
  description: string
}

const listStocks = (aiState: ReturnType<typeof getMutableAIState>) =>
  ({
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
    render: async function* ({ stocks }: ListStocksInfo) {
      yield (
        <BotCard>
          <StocksSkeleton />
        </BotCard>
      )

      await sleep(1000)

      aiResponseMessage = {
        id: nanoid(),
        role: 'function',
        name: 'listStocks',
        content: JSON.stringify(stocks)
      }

      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, aiResponseMessage]
      })

      return (
        <BotCard>
          <Stocks props={stocks} />
        </BotCard>
      )
    }
  }) as const satisfies NonNullable<TFunctions>[string]

const showStockPrice = (aiState: ReturnType<typeof getMutableAIState>) =>
  ({
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
    render: async function* ({ symbol, price, delta }: StockPriceInfo) {
      yield (
        <BotCard>
          <StockSkeleton />
        </BotCard>
      )

      await sleep(1000)

      const aiResponseMessage = {
        id: nanoid(),
        role: 'function',
        name: 'showStockPrice',
        content: JSON.stringify({ symbol, price, delta })
      }

      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, aiResponseMessage]
      })

      return (
        <BotCard>
          <Stock props={{ symbol, price, delta }} />
        </BotCard>
      )
    }
  }) as const satisfies NonNullable<TFunctions>[string]

const showStockPurchase = (aiState: ReturnType<typeof getMutableAIState>) =>
  ({
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

    render: async function* ({
      symbol,
      price,
      numberOfShares = 100
    }: StockPurchaseInfo) {
      if (numberOfShares <= 0 || numberOfShares > 1000) {
        const aiResponseMessage = {
          id: nanoid(),
          role: 'system',
          content: `[User has selected an invalid amount]`
        }

        aiState.done({
          ...aiState.get(),
          messages: [...aiState.get().messages, aiResponseMessage]
        })

        return <BotMessage content={'Invalid amount'} />
      }

      const aiResponseMessage = {
        id: nanoid(),
        role: 'function',
        name: 'showStockPurchase',
        content: JSON.stringify({
          symbol,
          price,
          numberOfShares
        })
      }

      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, aiResponseMessage]
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
  }) as const satisfies NonNullable<TFunctions>[string]

const getEvents = (aiState: ReturnType<typeof getMutableAIState>) =>
  ({
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

    render: async function* ({ events }: { events: EventInfo[] }) {
      yield (
        <BotCard>
          <EventsSkeleton />
        </BotCard>
      )

      await sleep(1000)

      const aiResponseMessage = {
        id: nanoid(),
        role: 'function',
        name: 'getEvents',
        content: JSON.stringify(events)
      }

      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, aiResponseMessage]
      })

      return (
        <BotCard>
          <Events props={events} />
        </BotCard>
      )
    }
  }) as const satisfies NonNullable<TFunctions>[string]

const stocksFunctions = (aiState: any) => {
  return {
    listStocks: listStocks(aiState),
    showStockPrice: showStockPrice(aiState),
    showStockPurchase: showStockPurchase(aiState),
    getEvents: getEvents(aiState)
  }
}

export { stocksFunctions }
