import { type Message } from 'ai'
import { type ObjectId } from 'mongodb'

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

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
