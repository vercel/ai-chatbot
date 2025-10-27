import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  // Migrate old model IDs to new ones
  function migrateModelId(modelId: string): string {
    const migrations: Record<string, string> = {
      "mistral-large-latest": "mistral-large-2407",
      "mistral-small-latest": "mistral-small-2409", 
      "codestral-latest": "codestral-2405"
    };
    
    return migrations[modelId] || modelId;
  }

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          isReadonly={false}
          key={id}
          userId={session.user?.id || ""}
        />
        <DataStreamHandler />
      </>
    );
  }

  const migratedModelId = migrateModelId(modelIdFromCookie.value);

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={migratedModelId}
        initialMessages={[]}
        isReadonly={false}
        key={id}
        userId={session.user?.id || ""}
      />
      <DataStreamHandler />
    </>
  );
}
