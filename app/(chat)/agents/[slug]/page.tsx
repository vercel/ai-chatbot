import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  getAgentWithUserState,
  getDatabaseUserFromWorkOS,
} from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { AgentDetailHeader } from '../components/agent-detail-header';
import { AgentPromptCard } from '../components/agent-prompt-card';
import { FileTextIcon } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await withAuth({ ensureSignedIn: true });

  const databaseUser = await getDatabaseUserFromWorkOS({
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName ?? undefined,
    lastName: session.user.lastName ?? undefined,
  });

  if (!databaseUser) {
    return null;
  }

  const res = await getAgentWithUserState({
    slug: (await params).slug,
    userId: databaseUser.id,
  });

  if (!res) {
    return (
      <div className="container mx-auto px-4 md:px-12 py-8">
        <div className="text-center py-16">
          <div className="p-4 bg-muted/20 rounded-lg inline-block mb-6">
            <FileTextIcon className="size-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Agent not found</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The agent you&apos;re looking for doesn&apos;t exist or has been
            removed. Please check the URL or browse our available agents.
          </p>
          <Button asChild size="lg">
            <Link href="/agents">Browse Agents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { agent } = res;

  return (
    <div className="min-h-screen bg-background">
      <AgentDetailHeader agent={agent} />

      {agent.agentPrompt && (
        <div className="container mx-auto px-4 md:px-12 py-8">
          <div className="max-w-4xl mx-auto">
            <AgentPromptCard agentPrompt={agent.agentPrompt} />
          </div>
        </div>
      )}
    </div>
  );
}
