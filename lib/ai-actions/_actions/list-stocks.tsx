import { z } from 'zod'
import { createAIChatbotAction } from '../genarators'
import { BotCard } from '@/components/stocks'
import { nanoid, sleep } from '@/lib/utils'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'

export const listStocksAction = createAIChatbotAction({
  id: 'listStocks',
  metadata: {
    title: 'List Stocks'
  }
})
  .describe('List three imaginary stocks that are trending.')
  .input({
    stocks: z.array(
      z.object({
        symbol: z.string().describe('The symbol of the stock'),
        price: z.number().describe('The price of the stock'),
        delta: z.number().describe('The change in price of the stock')
      })
    )
  })
  .handler(() => {})
  .render(async function* ({ input, context }) {
    const { stocks } = input
    const { aiState } = context
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
  })
