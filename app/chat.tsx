"use client";

import { type Message } from "@prisma/client";
import { useChat, type Message as AIMessage } from "ai-connector";
import { ChatList } from "./chat-list";
import { Prompt } from "./prompt";

export interface ChatProps {
  // create?: (input: string) => Chat | undefined;
  initialMessages?: Message[];
  id?: string;
}

export function Chat({
  id,
  // create,
  initialMessages,
}: ChatProps) {
  const { isLoading, messages, reload, append } = useChat({
    id,
    initialMessages: initialMessages as AIMessage[],
  });

  return (
    <main className="transition-width relative min-h-full w-full flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1">
        <ChatList messages={messages as Message[]} />
      </div>
      <div className="sticky light-gradient dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950 bottom-0 left-0 w-full border-t bg-white dark:bg-black md:border-t-0 py-4 md:border-transparent md:!bg-transparent md:dark:border-transparent pr-0 lg:pr-[260px] flex dark:border-transparent items-center justify-center">
        <Prompt
          onSubmit={(v) =>
            append({
              role: "user",
              content: v,
            })
          }
          onRefresh={messages.length ? reload : undefined}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}

Chat.displayName = "Chat";
