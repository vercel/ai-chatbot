import { type Message } from 'ai-connector'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  messages: Message[]
}
