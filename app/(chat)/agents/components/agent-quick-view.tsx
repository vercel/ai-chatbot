'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Agent } from '@/lib/db/schema';
import { AgentPromptCard } from './agent-prompt-card';
import { generateUUID } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AgentQuickViewProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentQuickView({ agent, open, onOpenChange }: AgentQuickViewProps) {
  const router = useRouter();

  const startChat = () => {
    if (!agent) return;
    const chatId = generateUUID();
    router.push(`/chat/${chatId}?agent=${agent.slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {agent && (
          <>
            <DialogHeader>
              <DialogTitle className="break-words">{agent.name}</DialogTitle>
              {agent.description && (
                <DialogDescription>{agent.description}</DialogDescription>
              )}
            </DialogHeader>

            {agent.agentPrompt && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Agent Prompt
                </h3>
                <AgentPromptCard agentPrompt={agent.agentPrompt} showTitle={false} />
              </div>
            )}

            <DialogFooter>
              <Button onClick={startChat}>Start Chat</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


