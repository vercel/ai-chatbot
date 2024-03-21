import { z } from 'zod'
import { createAIChatbotAction } from '../genarators'
import { BotCard, BotMessage } from '@/components/stocks'
import { nanoid, sleep } from '@/lib/utils'
import { Purchase } from '@/components/stocks/stock-purchase'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'

export const showStockPurchaseAction = createAIChatbotAction({
  id: 'showStockPurchase',
  metadata: {
    title: 'Show Stock Purchase'
  }
})
  .describe(
    'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.'
  )
  .input({
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
  })
  .noHandler()
  .render(async function* ({ input, context }) {
    const { symbol, price, numberOfShares = 100 } = input
    const { aiState } = context

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
  })
