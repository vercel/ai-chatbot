import { auth } from '@/app/(auth)/auth';
import { AgentFormComponent } from '@/app/(chat)/agent/agent-form';
import { getAgentById } from '@/db/queries';
import { notFound } from 'next/navigation';

export default async function AgentEditPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  const agent = await getAgentById({ id: params.id });

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
