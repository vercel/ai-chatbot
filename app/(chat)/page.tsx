import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { GuestHandler } from "@/components/guest-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

const ChatPage = async () => {
  const id = nanoid();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");
  const initialChatModel = modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  return (
    <>
      <GuestHandler />
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={initialChatModel}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
};

export default ChatPage;
