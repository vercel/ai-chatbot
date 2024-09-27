import { CoreMessage } from 'ai'
import { z } from 'zod'
import { showStockPriceSchema, getEventsSchema, listStockSchema, showStockPurchaseSchema } from './schemas'

export type Message = CoreMessage & {
  id: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
    error: string
  }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}
export type ShowStockPriceProps = z.infer<typeof showStockPriceSchema>
export type GetEventProps = z.infer<typeof getEventsSchema>
export type ListStockProps = z.infer<typeof listStockSchema>
export type ShowStockPurchaseProps = z.infer<typeof showStockPurchaseSchema>

export type PurchaseProps = {
  status: 'requires_action' | 'completed' | 'expired'
} & ShowStockPurchaseProps