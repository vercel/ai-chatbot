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
  const { messages, append, reload, stop, isLoading } = useChat({
    initialMessages,
    id
  })

  return (
    <div className="pb-[200px] pt-4 md:pt-10">
      <ChatList messages={messages} />
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
      />
    </div>
  )
}
