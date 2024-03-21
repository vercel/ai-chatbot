import { z } from 'zod'
import { createAIChatbotAction } from '../genarators'
import { BotCard } from '@/components/stocks'
import { nanoid, sleep } from '@/lib/utils'
import { Stock } from '@/components/stocks/stock'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'

export const showStockPriceAction = createAIChatbotAction({
  id: 'showStockPrice',
  metadata: {
    title: 'Show Stock Price'
  }
})
  .describe(
    'Get the current stock price of a given stock or currency. Use this to show the price to the user.'
  )
  .input({
    symbol: z
      .string()
      .describe(
        'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
      ),
    price: z.number().describe('The price of the stock.'),
    delta: z.number().describe('The change in price of the stock')
  })
  .handler(() => {})
  .render(async function* ({ input, context }) {
    const { symbol, price, delta } = input
    const { aiState } = context
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
  })
