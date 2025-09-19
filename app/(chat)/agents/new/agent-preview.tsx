'use client';

import { PreviewChatCore } from './preview-chat-core';

interface AgentPreviewProps {
  formData: {
    name: string;
    description: string;
    agentPrompt: string;
    isPublic: boolean;
    vectorStoreId?: string;
  };
  user: any;
}

export function AgentPreview({ formData, user }: AgentPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-medium">Agent Preview</h3>
        <p className="text-sm text-muted-foreground">
          Test your agent as you configure it
        </p>
      </div>

      <div className="flex-1 relative px-4">
        <PreviewChatCore formData={formData} user={user} />
      </div>
    </div>
  );
}
