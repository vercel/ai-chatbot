import { type Message } from 'ai'
import { type ObjectId } from 'mongodb'
import { LLMID } from "."

export interface Chat {
  _id: ObjectId
  id: string
  title: string
  userId: string
  createdAt: Date
  modifiedAt: Date
  path: string
  messages: Message[]
  sharePath?: string
}

export interface ChatSettings {
  model: LLMID
  prompt: string
  temperature: number
  contextLength: number
  embeddingsProvider: "openai" | "local"
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings
  messages: Message[]
}