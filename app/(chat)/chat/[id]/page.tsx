import { CoreMessage } from 'ai';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { auth } from '@/app/(auth)/auth';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { getChatById } from '@/db/queries';
import { Chat } from '@/db/schema';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: { params: Promise<any> }) {
  const params = await props.params;
  const { id } = params;
  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  // type casting
  const chat: Chat = {
    ...chatFromDb,
    messages: convertToUIMessages(chatFromDb.messages as Array<CoreMessage>),
  };

  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chat.userId) {
    return notFound();
  }

  let selectedModelId: string = DEFAULT_MODEL_NAME;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModel = models.find((model) => model.id === modelIdFromCookie);

  if (selectedModel) {
    const canUseModel =
      !selectedModel.requiresAuth || (selectedModel.requiresAuth && session);

    if (canUseModel) {
      selectedModelId = selectedModel.id;
    }
  }

  return (
    <PreviewChat
      id={chat.id}
      initialMessages={chat.messages}
      selectedModelId={selectedModelId}
      user={session?.user}
    />
  );
}
