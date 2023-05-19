import { Sidebar } from "@/app/sidebar";
import { prisma } from "@/lib/prisma";

import { Chat } from "../../chat";
import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface ChatPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
    },
  });
  return {
    title: chat?.title.slice(0, 50) ?? "Chat",
  };
}

// Prisma does not support Edge without the Data Proxy currently
export const runtime = "nodejs"; // default
export const preferredRegion = "home";
export const dynamic = "force-dynamic";
export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
    },
    include: {
      messages: true,
    },
  });
  if (!chat) {
    throw new Error("Chat not found");
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <Sidebar session={session} />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Chat id={chat.id} messages={chat.messages} />
      </div>
    </div>
  );
}

ChatPage.displayName = "ChatPage";
