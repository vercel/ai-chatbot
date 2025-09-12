import { withAuth } from '@workos-inc/authkit-nextjs';
import { getPublicAgents, getUserOwnedAgents, getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { AgentsList } from './components/agents-list';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  // Get the database user
  const dbUser = await getDatabaseUserFromWorkOS({
    id: user.id,
    email: user.email,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
  });

  // Get user's own agents (both public and private)
  const myAgents = dbUser 
    ? await getUserOwnedAgents({ userId: dbUser.id, limit: 1000, offset: 0 })
    : { data: [], total: 0 };

  // Get all public agents
  const publicAgents = await getPublicAgents({ limit: 1000, offset: 0 });

  return (
    <div className="container mx-auto px-4 md:px-12 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg">
          Manage your agents and discover ones created by the community
        </p>
      </div>

      {myAgents.data.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">My Agents</h2>
          <p className="text-muted-foreground mb-6">
            Your personal agents (both public and private)
          </p>
          <AgentsList agents={myAgents.data} />
        </div>
      )}

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Community Agents</h2>
        <p className="text-muted-foreground mb-6">
          Public agents created by the community
        </p>
        <AgentsList agents={publicAgents.data} />
      </div>
    </div>
  );
}

