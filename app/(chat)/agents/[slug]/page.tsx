import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  getAgentWithUserState,
  getDatabaseUserFromWorkOS,
} from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentDetailHeader } from '../components/agent-detail-header';
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
      <div className="container mx-auto px-12 py-8">
        <div className="text-center py-12">
          <div className="p-4 bg-muted/20 rounded-lg inline-block mb-4">
            <FileTextIcon className="size-8 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">Agent not found</h3>
          <p className="text-muted-foreground mb-6">
            The agent you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button asChild>
            <Link href="/agents">Browse Agents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { agent, saved } = res;

  return (
    <div className="min-h-screen bg-background">
      <AgentDetailHeader agent={agent} />

      <div className="container mx-auto px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Agent Prompt Section */}
          {agent.agentPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-5" />
                  Agent Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {agent.agentPrompt}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
