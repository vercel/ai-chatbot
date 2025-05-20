import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { InferUIDataTypes, UIMessage } from 'ai';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatStoreProvider } from '@/components/chat-store';
import { dataPartSchemas, type MessageMetadata } from '@/lib/types';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(
    messages: Array<DBMessage>,
  ): Array<
    UIMessage<MessageMetadata, InferUIDataTypes<typeof dataPartSchemas>>
  > {
    return messages.map((message) => ({
      id: message.id,
      role: message.role as UIMessage['role'],
      createdAt: message.createdAt,
      parts: (message.parts as any[]).map((part: any) => {
        const schema =
          dataPartSchemas[part.type as keyof typeof dataPartSchemas];

        if (!schema) {
          throw new Error(
            `Unknown message part type '${part.type}' in message ${message.id}`,
          );
        }

        return {
          type: part.type,
          id: part.id,
          data: schema.parse(part.data),
        };
      }),
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <ChatStoreProvider
        id={id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        visibilityType={chat.visibility}
        initialMessages={convertToUIMessages(messagesFromDb)}
      >
        <Chat
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler id={id} />
      </ChatStoreProvider>
    );
  }

  return (
    <ChatStoreProvider
      id={id}
      initialChatModel={chatModelFromCookie.value}
      visibilityType={chat.visibility}
      initialMessages={convertToUIMessages(messagesFromDb)}
    >
      <Chat
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </ChatStoreProvider>
  );
}
