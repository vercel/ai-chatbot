import { cookies } from 'next/headers';
import { Chat } from '@ai-chat/components/chat';
import { ChatModeKeyOptions } from '@ai-chat/app/api/models';
import { DataStreamHandler } from '@ai-chat/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

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
          autoResume={true}
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
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
