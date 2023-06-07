'use client'

import { type Message } from 'ai-connector'

import { ChatMessage } from './chat-message'
import { EmptyScreen } from './empty-screen'

export interface ChatList {
  messages: Message[]
}

export function ChatList({ messages }: ChatList) {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* <div className="sticky top-0 border-b w-full bg-black md:hidden text-white font-semibold">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex flex-row gap-2 whitespace-nowrap items-center">
            <NextChatLogo className="h-6 w-6" />
            <span className="select-none">Next.js Chatbot</span>
          </div>
          <div>
            <button className="text-white p-2 rounded hover:bg-zinc-800 transition duration-100">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div> */}
      {messages.length > 0 ? (
        <div className="group">
          {messages.map(message => (
            <ChatMessage
              key={message.id || message.content}
              message={message}
            />
          ))}
        </div>
      ) : (
        <div className="pt-10">
          <EmptyScreen />
        </div>
      )}
    </div>
  )
}
