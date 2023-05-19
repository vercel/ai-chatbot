"use client";

import { type Message } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ChatList } from "./chat-list";
import { Prompt } from "./prompt";
import { usePrompt } from "./use-prompt";

export interface ChatProps {
  // create?: (input: string) => Chat | undefined;
  messages?: Message[];
  id?: string;
}

export function Chat({
  id: _id,
  // create,
  messages,
}: ChatProps) {
  const router = useRouter();

  const { isLoading, messageList, appendUserMessage, reloadLastMessage } =
    usePrompt({
      messages,
      _id,
      // onCreate: (id: string) => {
      //   router.push(`/chat/${id}`);
      // },
    });

  return (
    <main className="transition-width relative min-h-full w-full flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1">
        <ChatList messages={messageList} />
      </div>
      <div className="sticky light-gradient dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950 bottom-0 left-0 w-full border-t bg-white dark:bg-black md:border-t-0 py-4 md:border-transparent md:!bg-transparent md:dark:border-transparent pr-0 lg:pr-[260px] flex dark:border-transparent items-center justify-center">
        <Prompt
          onSubmit={appendUserMessage}
          onRefresh={messageList.length ? reloadLastMessage : undefined}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}

Chat.displayName = "Chat";
