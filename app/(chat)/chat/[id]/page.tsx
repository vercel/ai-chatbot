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
  console.time(`Page Component - Chat ${pageId} - Step 1: Get Chat`);
  // --- End Start Timer ---

  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });
  console.timeEnd(`Page Component - Chat ${pageId} - Step 1: Get Chat`);

  if (!chat) {
    notFound();
  }

  console.time(`Page Component - Chat ${pageId} - Step 2: Get User`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.timeEnd(`Page Component - Chat ${pageId} - Step 2: Get User`);

  if (chat.visibility === 'private') {
    if (!user) {
      return notFound();
    }

    if (user.id !== chat.userId) {
      return notFound();
    }
  }

  console.time(`Page Component - Chat ${pageId} - Step 3: Get Messages`);
  const messagesFromDb = await getMessagesByChatId({
    id,
  });
  console.timeEnd(`Page Component - Chat ${pageId} - Step 3: Get Messages`);

  console.time(`Page Component - Chat ${pageId} - Step 4: Get Document`);
  const { data: associatedDocument, error: docError } = await supabase
    .from('Document')
    .select('id, title, kind, content')
    .eq('chat_id', id)
    .limit(1)
    .maybeSingle();
  console.timeEnd(`Page Component - Chat ${pageId} - Step 4: Get Document`);

  if (docError) {
    console.error(
      `Error fetching associated document for chat ${id}:`,
      docError,
    );
  }

  console.time(
    `Page Component - Chat ${pageId} - Step 5: Convert Messages & Cookies`,
  );
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
  const processedMessages = convertToUIMessages(messagesFromDb); // Process messages

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  const selectedModel = chatModelFromCookie?.value || DEFAULT_CHAT_MODEL;
  console.timeEnd(
    `Page Component - Chat ${pageId} - Step 5: Convert Messages & Cookies`,
  );

  console.time(`Page Component - Chat ${pageId} - Step 6: Render`);
  const result = (
    <>
      <Chat
        id={chat.id}
        initialMessages={processedMessages}
        initialAssociatedDocument={associatedDocument ?? null}
        selectedChatModel={selectedModel}
        selectedVisibilityType={chat.visibility}
        isReadonly={user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
  console.timeEnd(`Page Component - Chat ${pageId} - Step 6: Render`);

  console.timeEnd(`Page Component - Chat ${id}`);
  return result;
}
