'use client'

import { type Message } from 'ai-connector'

import { ChatMessage } from '@/components/chat-message'
import { EmptyScreen } from '@/components/empty-screen'

export interface ChatList {
  messages: Message[]
}

export function ChatList({ messages }: ChatList) {
  return (
    <div className="relative max-w-2xl mx-auto">
      {messages.length > 0 ? (
        messages.map(message => (
          <ChatMessage key={message.id || message.content} message={message} />
        ))
      ) : (
        <div className="pt-10">
          <EmptyScreen />
        </div>
      )}
    </div>
  )
}
