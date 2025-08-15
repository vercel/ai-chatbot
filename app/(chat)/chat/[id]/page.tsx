import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { withAuth } from '@workos-inc/authkit-nextjs';
import { Chat } from '@/components/chat';
import {
  getChatById,
  getDatabaseUserFromWorkOS,
  getMessagesByChatId,
} from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const { user } = await withAuth({ ensureSignedIn: true });

  // Get the database user from the WorkOS user for proper ID comparisons
  const databaseUser = user
    ? await getDatabaseUserFromWorkOS({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      })
    : null;

  if (chat.visibility === 'private') {
    if (!user || !databaseUser) {
      return notFound();
    }

    if (databaseUser.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  // Validate that the cookie value is a valid model ID
  const isValidModel =
    chatModelFromCookie &&
    chatModels.some((model) => model.id === chatModelFromCookie.value);
  const initialChatModel = isValidModel
    ? chatModelFromCookie.value
    : DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={initialChatModel}
        initialVisibilityType={chat.visibility}
        isReadonly={!databaseUser || databaseUser.id !== chat.userId}
        user={user}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
