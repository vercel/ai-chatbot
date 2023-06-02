import { Sidebar } from "@/app/sidebar";

import { auth } from "@/auth";
import { type Metadata } from "next";

import { Chat } from "@/app/chat";
import { type Chat as ChatType } from "@/lib/types";
import { kv } from "@vercel/kv";
import { Message } from "ai-connector";

export const runtime = "edge";
export const preferredRegion = "home";
export interface ChatPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const session = await auth();
  const chat = await getChat(params.id, session?.user?.email ?? "");
  return {
    title: chat?.title.slice(0, 50) ?? "Chat",
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth();
  const chat = await getChat(params.id, session?.user?.email ?? "");

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <Sidebar session={session} />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Chat id={chat.id} initialMessages={chat.messages as Message[]} />
      </div>
    </div>
  );
}

ChatPage.displayName = "ChatPage";

async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<ChatType>(`chat:${id}`);
  if (!chat) {
    throw new Error("Not found");
  }

  if (userId && chat.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return chat;
}
