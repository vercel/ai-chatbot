import { CoreMessage } from 'ai';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { auth } from '@/app/(auth)/auth';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { getAgentById, getChatById } from '@/db/queries';
import { Chat } from '@/db/schema';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: {
  params: Promise<{ id: string; agentId: string }>;
}) {
  const params = await props.params;
  const { id, agentId } = params;
  const chatFromDb = await getChatById({ id });
  const agentFromDb = await getAgentById({ id: agentId });

  if (!chatFromDb || !agentFromDb) {
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

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <PreviewChat
      id={chat.id}
      initialMessages={chat.messages}
      selectedModelId={agentFromDb.id}
      agent={agentFromDb}
    />
  );
}
