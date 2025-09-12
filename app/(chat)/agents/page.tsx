import { withAuth } from '@workos-inc/authkit-nextjs';
import { getPublicAgents } from '@/lib/db/queries';
import { AgentsList } from './components/agents-list';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  await withAuth({ ensureSignedIn: true });

  const { data } = await getPublicAgents({ limit: 1000, offset: 0 });

  return (
    <div className="container mx-auto px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground mt-2">
          Discover and use AI agents created by the community
        </p>
      </div>

      <AgentsList agents={data} />
    </div>
  );
}

