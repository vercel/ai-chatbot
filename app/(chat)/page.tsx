import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "../(auth)/auth";

async function ChatPageContent() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}

function ChatLoadingFallback() {
  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="ml-auto h-8 w-24 md:ml-0" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-4 md:px-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}
