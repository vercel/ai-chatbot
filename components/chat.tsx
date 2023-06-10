'use client'

import { useChat, type Message } from 'ai-connector'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'

export interface ChatProps {
  // create?: (input: string) => Chat | undefined;
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages }: ChatProps) {
  const { messages, append, reload, isLoading } = useChat({
    initialMessages,
    id
  })

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full w-full overflow-auto pb-[200px]">
        <ChatList messages={messages} />
        <ChatPanel
          id={id}
          append={append}
          isLoading={isLoading}
          reload={reload}
          messages={messages}
        />
      </div>
    </div>
  )
}
