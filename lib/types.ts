import { CoreMessage } from 'ai'

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
    period: Period
    plan: Plan
    stripeId: string | null
    startDate: Date | null
    chargeDate: Date
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
  subscriptionId: string
  plan: Plan
  period: Period
}

export type Period = 'anual' | 'month';

export type Plan = 'free' | 'basic' | 'premium';

export interface DocumentoSTJ {
  process: string
  relator: string
  classe: string
  ementa: string
  acordao: string
  misc: string
  link: string
}

// export interface Subscription {
//   id: string
//   userId: string
//   plan: 'free' | 'basic' | 'premium'
//   period: 'anual' | 'month'
//   startDate: Date
//   endDate: Date
// }