import { z } from "zod"
const getEventsSchema = z.object({
    events: z.array(
        z.object({
            date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
            headline: z.string().describe('The headline of the event'),
            description: z.string().describe('The description of the event')
        })
    )
})

const showStockPurchaseSchema = z.object({
    symbol: z
        .string()
        .describe(
            'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
        ),
    price: z.number().describe('The price of the stock.'),
    numberOfShares: z
        .number()
        .optional()
        .describe(
            'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
        )
})
const showStockPriceSchema = z.object({
    symbol: z
        .string()
        .describe(
            'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
        ),
    price: z.number().describe('The price of the stock.'),
    delta: z.number().describe('The change in price of the stock')
})
const listStockSchema = z.object({
    stocks: z.array(
        z.object({
            symbol: z.string().describe('The symbol of the stock'),
            price: z.number().describe('The price of the stock'),
            delta: z.number().describe('The change in price of the stock')
        })
    )
})
export { getEventsSchema, showStockPurchaseSchema, showStockPriceSchema, listStockSchema }