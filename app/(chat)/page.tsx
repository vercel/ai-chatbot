import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function Page() {
  const { user } = await withAuth({ ensureSignedIn: true });

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Validate that the cookie value is a valid model ID
  const isValidModel =
    modelIdFromCookie &&
    chatModels.some((model) => model.id === modelIdFromCookie.value);
  const initialChatModel = isValidModel
    ? modelIdFromCookie.value
    : DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialChatModel}
        initialVisibilityType="private"
        isReadonly={false}
        user={user}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
