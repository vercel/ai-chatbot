import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { getAgentById, getChatById, getMessagesByChatId } from '@/db/queries';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: {
  params: Promise<{ id: string; agentId: string }>;
}) {
  const params = await props.params;
  const { id, agentId } = params;
  const chatFromDb = await getChatById({ id });
  const agentFromDb = await getAgentById({ id: agentId });

  if (!chatFromDb || !agentFromDb) {
    return notFound();
  }

  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chatFromDb.userId) {
    return notFound();
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  return (
    <PreviewChat
      id={chatFromDb.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={agentFromDb.id}
      agent={agentFromDb}
    />
  );
}
