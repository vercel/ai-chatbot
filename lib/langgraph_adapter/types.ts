import type { Client } from '@langchain/langgraph-sdk'

// Interface for stream callback functions
export interface LangGraphStreamCallbacks {
  onStart?: (messageId: string, threadId: string) => void
  onToken?: (token: string) => void
  onError?: (error: any) => void
  onFinish?: (
    stats: { finishReason: string; usage: any },
    threadId: string,
    client: Client
  ) => void
}

export type LangGraphStreamEvent = {
  event: string
  data: any
}
