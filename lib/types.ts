import { CoreMessage } from 'ai'
import { MergeDeep } from 'type-fest'
import { Database as SupabaseDatabase } from '@/utils/supabase/types'

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

export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Tables: {
        chats: {
          Row: {
            payload: Chat | null
          }
          Insert: {
            payload?: Chat | null
          }
          Update: {
            payload?: Chat | null
          }
        }
      }
    }
  }
>
