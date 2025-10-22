"use client";

import { motion } from "framer-motion";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={cn(
          'flex gap-3',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {/* Assistant avatar on left */}
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-semibold">
            G
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'max-w-[70%] bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
              : 'w-full bg-transparent text-zinc-900 dark:text-zinc-100'
          )}
        >
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        </div>

        {/* User avatar on right */}
        {isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-white text-sm font-semibold dark:bg-zinc-200 dark:text-zinc-800">
            U
          </div>
        )}
      </div>
    </motion.div>
  );
}
