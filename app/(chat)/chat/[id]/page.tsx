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

export default async function Page(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ agent?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const { agent } = searchParams;
  const chat = await getChatById({ id });

  // If chat doesn't exist, we'll create a new one (similar to home page behavior)
  const isNewChat = !chat;

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

  if (!isNewChat) {
    // Existing chat - check permissions
    if (chat.visibility === 'private') {
      if (!user || !databaseUser) {
        return notFound();
      }

      if (databaseUser.id !== chat.userId) {
        return notFound();
      }
    }
  }

  const messagesFromDb = isNewChat ? [] : await getMessagesByChatId({ id });
  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  const cookieModelId = chatModelFromCookie?.value;
  let initialChatModel = DEFAULT_CHAT_MODEL;
  if (cookieModelId && chatModels.some((model) => model.id === cookieModelId)) {
    initialChatModel = cookieModelId;
  }

  return (
    <>
      <Chat
        id={id}
        initialMessages={uiMessages}
        initialChatModel={initialChatModel}
        initialVisibilityType={isNewChat ? 'private' : chat.visibility}
        isReadonly={isNewChat ? false : (!databaseUser || databaseUser.id !== chat.userId)}
        user={user}
        autoResume={!isNewChat}
        initialLastContext={isNewChat ? undefined : (chat.lastContext ?? undefined)}
      />
      <DataStreamHandler />
    </>
  );
}
