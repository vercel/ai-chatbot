import { type experimental_StreamingReactResponse, type Message } from 'ai'

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

// TODO: Import from ai/react when it's available.
export type StreamingReactResponseAction = (
  meta: {
    id?: string
    previewToken: string | null
  },
  {
    messages,
    data
  }: {
    messages: Message[]
    data?: Record<string, string>
  }
) => Promise<experimental_StreamingReactResponse>
