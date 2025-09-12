import { withAuth } from '@workos-inc/authkit-nextjs';
import { getAgentWithUserState, getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AgentPromptEditor } from '@/components/agent-prompt-editor';

export const dynamic = 'force-dynamic';

export default async function Page({
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
    // middleware redirects unauth users, but keep a guard
    return null;
  }

  const res = await getAgentWithUserState({
    slug: params.slug,
    userId: databaseUser.id,
  });

  if (!res) {
    return (
      <div className="p-6">
        <div>Agent not found.</div>
      </div>
    );
  }

  const { agent, saved, customPrompt } = res;

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="font-semibold text-2xl">{agent.name}</div>
      {agent.description && (
        <div className="text-muted-foreground mt-2">{agent.description}</div>
      )}
      <div className="mt-6 space-y-3">
        <div className="text-sm font-medium">Custom Prompt</div>
        <AgentPromptEditor
          agentId={agent.id}
          initialSaved={saved}
          initialCustomPrompt={customPrompt ?? ''}
        />
      </div>
    </div>
  );
}

