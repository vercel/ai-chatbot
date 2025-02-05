import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { chatModels, DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

import { auth } from '../(auth)/auth';

export default async function Page() {
  const id = generateUUID();
  const session = await auth();

  let selectedChatModelId: string = DEFAULT_CHAT_MODEL;

  const cookieStore = await cookies();
  const chatModelIdFromCookie = cookieStore.get('chat-model')?.value;
  const selectedChatModel = chatModels.find(
    (chatModel) => chatModel.id === chatModelIdFromCookie,
  );

  if (selectedChatModel) {
    const canUseModel =
      !selectedChatModel.requiresAuth ||
      (selectedChatModel.requiresAuth && session);

    if (canUseModel) {
      selectedChatModelId = selectedChatModel.id;
    }
  }

  return (
    <>
      <Chat
        key={id}
        id={session ? id : 'guest'}
        initialMessages={[]}
        selectedChatModelId={selectedChatModelId}
        user={session?.user}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={session ? id : 'guest'} />
    </>
  );
}
