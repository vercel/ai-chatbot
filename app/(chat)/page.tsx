import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatStoreProvider } from '@/components/chat-store';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <ChatStoreProvider
        id={id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialMessages={[]}
        visibilityType="private"
      >
        <Chat
          key={id}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </ChatStoreProvider>
    );
  }

  return (
    <ChatStoreProvider
      id={id}
      initialChatModel={modelIdFromCookie.value}
      initialMessages={[]}
      visibilityType="private"
    >
      <Chat
        key={id}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </ChatStoreProvider>
  );
}
