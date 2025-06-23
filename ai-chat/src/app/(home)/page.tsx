import { cookies } from 'next/headers';
import { Chat } from '@ai-chat/components/chat';
import { DataStreamHandler } from '@ai-chat/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@ai-chat/lib/ai/models';
import { generateUUID } from '@ai-chat/lib/utils';

export default async function Home() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={null}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={null}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
