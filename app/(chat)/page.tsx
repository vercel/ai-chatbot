import { cookies } from "next/headers";

import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { Session } from "next-auth";
import { GuestLimitBanner } from "@/components/GuestLimitBanner";

// Criando uma sessão mock com o tipo correto
const mockSession: Session = {
  user: {
    id: "guest-user",
    name: "Convidado",
    email: "guest@example.com",
    type: "guest" as any,
    image: null,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export default async function Page() {
  const session = mockSession;

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");
  const guestMessages = Number(cookieStore.get("guest-message-count")?.value ?? "0");

  const banner =
    session.user.type === "guest" ? (
      <GuestLimitBanner used={guestMessages} max={20} />
    ) : null;

  if (!modelIdFromCookie) {
    return (
      <>
        {banner}
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      {banner}
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
