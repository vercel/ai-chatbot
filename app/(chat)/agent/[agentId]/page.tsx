import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/custom/chat';
import { getAgentById } from '@/db/queries';
import { generateUUID } from '@/lib/utils';

export default async function AgentPage(props: {
  params: Promise<{ agentId: string }>;
}) {
  const params = await props.params;
  const { agentId } = params;
  const session = await auth();
  const agent = await getAgentById({ id: agentId });

  if (!session || !session.user) {
    return notFound();
  }

  if (!agent || agent.userId !== session?.user?.id) {
    return notFound();
  }

  const id = generateUUID();

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={agent.id}
      agent={agent}
    />
  );
}
