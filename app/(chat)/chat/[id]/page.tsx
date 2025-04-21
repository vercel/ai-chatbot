import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage, Document } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  // --- Start Timer ---
  const pageId = (await props.params).id; // Resolve id early for logging
  console.time(`Page Component - Chat ${pageId}`);
  // --- End Start Timer ---

  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (chat.visibility === 'private') {
    if (!user) {
      return notFound();
    }

    if (user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const { data: associatedDocument, error: docError } = await supabase
    .from('Document')
    .select('id, title, kind, content')
    .eq('chat_id', id)
    .limit(1)
    .maybeSingle();

  if (docError) {
    console.error(
      `Error fetching associated document for chat ${id}:`,
      docError,
    );
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
  const selectedModel = chatModelFromCookie?.value || DEFAULT_CHAT_MODEL;

  const result = (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialAssociatedDocument={associatedDocument ?? null}
        selectedChatModel={selectedModel}
        selectedVisibilityType={chat.visibility}
        isReadonly={user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );

  // --- End Timer ---
  console.timeEnd(`Page Component - Chat ${id}`);
  // --- End End Timer ---
  return result;
}
