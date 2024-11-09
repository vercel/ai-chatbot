import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat } from '@/components/custom/chat';
import { getChatById, getMessagesByChatId } from '@/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';

export default async function Page() {
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const chatIdFromCookie = cookieStore.get('chat-id')?.value ?? '';

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  if (chatIdFromCookie) {
    const chat = await getChatById({ id: chatIdFromCookie });
    const userId = cookieStore.get('user')?.value ?? '';

    if (chat && userId !== chat.userId) {
      return notFound();
    }

    const messagesFromDb = await getMessagesByChatId({ id: chatIdFromCookie });

    return (
      <Chat
        id={chat?.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
      />
    );
  }

  return <Chat id="" initialMessages={[]} selectedModelId={selectedModelId} />;
}
