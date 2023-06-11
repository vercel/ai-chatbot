'use client'

import { type Message } from 'ai-connector'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'
import { EmptyScreen } from '@/components/empty-screen'

export interface ChatList {
  messages: Message[]
}

export function ChatList({ messages }: ChatList) {
  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.length > 0 ? (
        messages.map((message, index) => (
          <div key={index}>
            <ChatMessage message={message} />
            {index < messages.length - 1 && <Separator className="my-8" />}
          </div>
        ))
      ) : (
        <EmptyScreen />
      )}
    </div>
  )
}
