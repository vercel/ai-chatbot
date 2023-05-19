"use client";

import { type Message } from "@prisma/client";

import { ChatMessage } from "./chat-message";

export interface ChatList {
  messages: Message[];
}

export function ChatList({ messages }: ChatList) {
  return (
    <div className="relative h-full dark:bg-zinc-900">
      <div className="h-full w-full overflow-auto">
        {messages.length > 0 ? (
          <div className="group w-full text-zinc-900 dark:text-white divide-y dark:divide-zinc-800">
            {messages.map((message) => (
              <ChatMessage
                key={message.id || message.content}
                message={message}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
