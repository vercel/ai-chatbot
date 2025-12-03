import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { isAuthDisabled } from "@/lib/constants";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { sessionIdMatchesChatUserId } from "@/lib/session-id-utils";
import { convertToUIMessages } from "@/lib/utils";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();
  const cookieStore = await cookies();

  // Only redirect if auth is enabled and no session exists
  if (!isAuthDisabled && !session) {
    redirect("/api/auth/guest");
  }

  // Determine if current user owns the chat (for readonly check)
  let isOwner = false;

  // Enforce private chat visibility - always check ownership
  if (chat.visibility === "private") {
    if (isAuthDisabled) {
      // When auth is disabled, check session ID from cookie
      const sessionId = cookieStore.get("session_id")?.value;
      if (!sessionId) {
        // No session ID in cookie - deny access to private chat
        return notFound();
      }

      // Convert session ID to UUID and compare with chat.userId
      isOwner = await sessionIdMatchesChatUserId(sessionId, chat.userId);
      if (!isOwner) {
        return notFound();
      }
    } else {
      // When auth is enabled, check authenticated user
      if (!session?.user) {
        return notFound();
      }

      isOwner = session.user.id === chat.userId;
      if (!isOwner) {
        return notFound();
      }
    }
  } else {
    // For public chats, check ownership for readonly (but allow viewing)
    if (isAuthDisabled) {
      const sessionId = cookieStore.get("session_id")?.value;
      if (sessionId) {
        isOwner = await sessionIdMatchesChatUserId(sessionId, chat.userId);
      }
    } else {
      isOwner = session?.user?.id === chat.userId;
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

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
