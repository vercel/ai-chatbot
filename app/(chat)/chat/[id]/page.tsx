import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';

export default async function Page({ params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return notFound();
    }
    
    // Check if the ID is a valid UUID format
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isValidUuid) {
      return notFound();
    }
    
    const chat = await getChatById({ id });

    if (!chat) {
      return notFound();
    }

    const session = await auth();

    if (!session) {
      return redirect('/api/auth/guest');
    }

    if (chat.visibility === 'private') {
      if (!session.user) {
        return notFound();
      }

      if (session.user.id !== chat.userId) {
        return notFound();
      }
    }

    // Try to get messages, but handle if the query fails
    let messagesFromDb: Array<DBMessage> = [];
    try {
      messagesFromDb = await getMessagesByChatId({
        id,
      });
    } catch (error) {
      console.error('Failed to fetch messages for chat:', error);
      // Continue with empty messages if query fails
    }

    function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
      return messages.map((message) => ({
        id: message.id,
        parts: message.parts as UIMessage['parts'],
        role: message.role as UIMessage['role'],
        // Note: content will soon be deprecated in @ai-sdk/react
        content: '',
        createdAt: message.createdAt,
        experimental_attachments:
          (message.attachments as Array<Attachment>) ?? [],
      }));
    }

    const cookieStore = await cookies();
    const chatModelFromCookie = cookieStore.get('chat-model');

    if (!chatModelFromCookie) {
      return (
        <>
          <Chat
            id={chat.id}
            initialMessages={convertToUIMessages(messagesFromDb)}
            selectedChatModel={DEFAULT_CHAT_MODEL}
            selectedVisibilityType={chat.visibility}
            isReadonly={session?.user?.id !== chat.userId}
            session={session}
          />
          <DataStreamHandler id={id} />
        </>
      );
    }

    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={chatModelFromCookie.value}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
        />
        <DataStreamHandler id={id} />
      </>
    );
  } catch (error) {
    console.error('Error in chat page:', error);
    return notFound();
  }
}
