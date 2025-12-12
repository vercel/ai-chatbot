import { cookies } from "next/headers"
import { Suspense } from "react"
import { Chat } from "@/components/chat"
import { DataStreamHandler } from "@/components/data-stream-handler"
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models"
import { generateUUID } from "@/lib/utils"
import { auth } from "../(auth)/auth"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  )
}

async function NewChatPage() {
  const session = await auth()

  // Previously this redirected to /api/auth/guest which caused loading issues

  const id = generateUUID()

  const cookieStore = await cookies()
  const modelIdFromCookie = cookieStore.get("chat-model")

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  )
}
