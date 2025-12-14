import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Chat as DBChat, DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { serverApiFetch } from "@/lib/server-api-client";
import { convertToUIMessages } from "@/lib/utils";

// Note: This page is automatically dynamic because it uses cookies() and serverApiFetch()
// No need to export dynamic = "force-dynamic" as it conflicts with cacheComponents config

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

  // Note: Authentication is handled by the middleware (proxy.ts)
  // If no user exists, the middleware redirects to /api/auth/guest
  // We can proceed directly to fetch the chat data

  // Fetch chat data from backend API
  let chatData: ChatData;
  try {
    const response = await serverApiFetch(`/api/chat/${id}`);

    if (!response.ok) {
      // Handle authentication errors - redirect to guest creation
      if (response.status === 401) {
        // Not authenticated - redirect to guest creation
        redirect("/api/auth/guest");
      }

      if (response.status === 404) {
        notFound();
      }

      if (response.status === 403) {
        // Forbidden - user doesn't have access to this chat
        // This could happen if:
        // 1. User is trying to access someone else's private chat
        // 2. User's session changed (e.g., guest session expired and new one created)
        // For security, treat as not found
        notFound();
      }

      const errorData = await response.json().catch(() => ({}));
      throw new ChatSDKError(
        errorData.code || "bad_request:api",
        errorData.cause || `Failed to fetch chat: ${response.statusText}`
      );
    }

    chatData = await response.json();
  } catch (error) {
    // Handle redirect errors (from redirect() call above)
    if (error && typeof error === "object" && "digest" in error) {
      throw error; // Re-throw Next.js redirect errors
    }

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

  // Get chat model from cookie (only needed for this page, not for auth)
  const cookieStore = await cookies();
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
