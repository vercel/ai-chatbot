import { cookies } from 'next/headers';
import { generateUUID } from '@ai-chat/lib/utils';
import { Chat } from '@ai-chat/components/chat';
import { DataStreamHandler } from '@ai-chat/components/data-stream-handler';
import type { Session } from '@ai-chat/lib/types';
import { ChatModeKeyOptions } from '../api/models';

export default async function Home() {
  const id = generateUUID();
  const tempSession: Session = {
    expires: '2100-10-05T14:48:00.000Z',
    user: { email: 'fsilva@icrc.org', id: generateUUID(), type: 'regular' },
  };
  const [session, cookieStore] = await Promise.all([tempSession, cookies()]);
  const modelIdFromCookie = cookieStore.get('chat-mode')
    ?.value as ChatModeKeyOptions;
  const DEFAULT_CHAT_MODEL: ChatModeKeyOptions = ChatModeKeyOptions.Generic;

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          isReadonly={false}
          session={session}
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
        initialChatModel={modelIdFromCookie}
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
