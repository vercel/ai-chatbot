import { cookies } from 'next/headers';
import { generateUUID } from '@ai-chat/lib/utils';
import { Chat } from '@ai-chat/components/chat';
import { DataStreamHandler } from '@ai-chat/components/data-stream-handler';
import { ChatModeKeyOptions } from './api/models';

export default async function Home() {
  const id = generateUUID();
  const [cookieStore] = await Promise.all([cookies()]);
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
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
