import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { AgentFormComponent } from '@/app/(chat)/agent/agent-form';
import { getAgentById } from '@/db/queries';

export default async function AgentEditPage(props: {
  params: Promise<{ agentId: string }>;
}) {
  const params = await props.params;
  const { agentId } = params;
  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  const agent = await getAgentById({ id: agentId });

  if (!agent || agent.userId !== session.user.id) {
    console.error('Agent not found or user does not own agent');
    return notFound();
  }

  return (
    <>
      <AgentFormComponent user={session?.user!} agent={agent} />
    </>
  );
}
