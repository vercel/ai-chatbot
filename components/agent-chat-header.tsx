'use client';

import { BotIcon } from 'lucide-react';

interface AgentChatHeaderProps {
  agentContext: {
    agentName: string;
    agentDescription?: string;
    agentPrompt?: string;
  };
}

export function AgentChatHeader({ agentContext }: AgentChatHeaderProps) {
  return (
    <div className="border-b bg-muted/30">
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <BotIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {agentContext.agentName}
          </span>
          {agentContext.agentDescription && (
            <span className="text-sm text-muted-foreground truncate">
              — {agentContext.agentDescription}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
