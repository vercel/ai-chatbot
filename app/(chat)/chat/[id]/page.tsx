import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { isAuthDisabled } from "@/lib/constants";
import type { Chat as DBChat, DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { serverApiFetch } from "@/lib/server-api-client";
import { convertToUIMessages } from "@/lib/utils";

type ChatData = {
  chat: DBChat;
  messages: DBMessage[];
  isOwner: boolean;
};

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const cookieStore = await cookies();

  // Only redirect if auth is enabled and no session exists
  if (!isAuthDisabled && !session) {
    redirect("/api/auth/guest");
  }

  // Fetch chat data from backend API
  let chatData: ChatData;
  try {
    const response = await serverApiFetch(`/api/chat/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      if (response.status === 403) {
        notFound(); // Forbidden - treat as not found for security
      }
      const errorData = await response.json().catch(() => ({}));
      throw new ChatSDKError(
        errorData.code || "bad_request:api",
        errorData.cause || `Failed to fetch chat: ${response.statusText}`
      );
    }

    chatData = await response.json();
  } catch (error) {
    if (error instanceof ChatSDKError && error.code === "not_found:chat") {
      notFound();
    }
    // Re-throw other errors
    throw error;
  }

  const { chat, messages: messagesFromApi, isOwner } = chatData;

  // Convert backend message format to DBMessage format
  // Backend returns createdAt as ISO string, but convertToUIMessages expects Date
  const messagesFromDb = messagesFromApi.map(
    (msg: DBMessage) =>
      ({
        id: msg.id,
        chatId: chat.id,
        role: msg.role as "user" | "assistant" | "system",
        parts: msg.parts ?? [],
        attachments: msg.attachments ?? [],
        createdAt: msg.createdAt,
      }) as DBMessage
  );

  const uiMessages = convertToUIMessages(messagesFromDb);

  const chatModelFromCookie = cookieStore.get("chat-model");

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialLastContext={chat.lastContext ?? undefined}
          initialMessages={uiMessages}
          initialVisibilityType={chat.visibility}
          isReadonly={!isOwner}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={!isOwner}
      />
      <DataStreamHandler />
    </>
  );
}
