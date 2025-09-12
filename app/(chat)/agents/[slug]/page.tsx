import { withAuth } from '@workos-inc/authkit-nextjs';
import { getAgentWithUserState, getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentPromptEditor } from '@/components/agent-prompt-editor';
import { AgentDetailHeader } from '../components/agent-detail-header';
import { FileTextIcon, SettingsIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({
  params,
}: {
  params: { slug: string };
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
    slug: params.slug,
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
            The agent you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <a href="/agents">Browse Agents</a>
          </Button>
        </div>
      </div>
    );
  }

  const { agent, saved, customPrompt } = res;

  return (
    <div className="min-h-screen bg-background">
      <AgentDetailHeader agent={agent} />
      
      <div className="container mx-auto px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Base Prompt Section */}
          {agent.basePrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-5" />
                  Base Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {agent.basePrompt}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Prompt Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="size-5" />
                Custom Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Customize this agent with your own prompt additions. This will be combined with the base prompt when chatting.
                </p>
                <AgentPromptEditor
                  agentId={agent.id}
                  initialSaved={saved}
                  initialCustomPrompt={customPrompt ?? ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Agent Details */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Agent ID:</span>
                  <span className="ml-2 font-mono">{agent.id}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono">{agent.slug}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Visibility:</span>
                  <span className="ml-2">{agent.isPublic ? 'Public' : 'Private'}</span>
                </div>
                {agent.modelId && (
                  <div>
                    <span className="font-medium text-muted-foreground">Model:</span>
                    <span className="ml-2">{agent.modelId}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <span className="ml-2">{new Date(agent.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Updated:</span>
                  <span className="ml-2">{new Date(agent.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

