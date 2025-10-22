"use client";

import { motion } from "framer-motion";
import type { RefObject } from "react";
import type { Message } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";

type ChatMessagesProps = {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onSuggestedPrompt?: (prompt: string) => void;
};

const SUGGESTED_PROMPTS = [
  {
    title: "Healthcare Philosophy",
    description: "Learn about Glen's approach to healthcare",
    prompt: "Tell me about your healthcare philosophy",
  },
  {
    title: "2025 Priorities",
    description: "Understand strategic focus areas",
    prompt: "What are your priorities for 2025?",
  },
  {
    title: "AI in Healthcare",
    description: "Explore AI transformation",
    prompt: "How do you think about AI in healthcare?",
  },
  {
    title: "Entrepreneur Advice",
    description: "Get leadership insights",
    prompt: "What advice do you have for entrepreneurs?",
  },
];

export function ChatMessages({ messages, messagesEndRef, onSuggestedPrompt }: ChatMessagesProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-6 pt-4 md:px-6">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Suggested prompts - only show if just initial message */}
      {messages.length <= 1 && onSuggestedPrompt && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-2"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.prompt}
              onClick={() => onSuggestedPrompt(item.prompt)}
              className="group rounded-xl border border-zinc-300 bg-white p-4 text-left transition-all hover:border-teal-500 hover:bg-teal-50 hover:shadow-md dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-teal-500 dark:hover:bg-teal-900/20"
            >
              <p className="mb-1 font-medium text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">{item.title}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.description}</p>
            </button>
          ))}
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
