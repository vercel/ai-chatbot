"use client";

import { type Message } from "@prisma/client";

import { ChatMessage } from "./chat-message";
import { NextChatLogo } from "@/components/ui/nextchat-logo";
import { Plus } from "lucide-react";

export interface ChatList {
  messages: Message[];
}

export function ChatList({ messages }: ChatList) {
  return (
    <div className="relative h-full dark:bg-zinc-900">
      <div className="sticky top-0 border-b w-full bg-black md:hidden text-white font-semibold">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex flex-row gap-1 whitespace-nowrap items-center">
            <NextChatLogo className="h-6 w-6" />
            <span className="select-none">Next.js Chatbot</span>
          </div>
          <div>
            <button className="text-white p-2 rounded hover:bg-zinc-800 transition duration-100">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
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
