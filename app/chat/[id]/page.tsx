import { Sidebar } from "@/app/sidebar";

import { type Metadata } from "next";
import { auth } from "@/auth";
import { db, chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Chat } from "@/app/chat";
import { Message } from "ai-connector";
export interface ChatPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, params.id),
  });
  return {
    title: chat?.title.slice(0, 50) ?? "Chat",
  };
}

export const runtime = "edge"; // default
export const preferredRegion = "home";

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth();
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, params.id),
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

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
