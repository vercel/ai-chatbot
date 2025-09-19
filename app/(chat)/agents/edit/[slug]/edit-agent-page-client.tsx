'use client';

import { useRef, useState } from 'react';
import type { Agent } from '@/lib/db/schema';
import { AgentPreview } from '../../new/agent-preview';
import { EditAgentHeader } from './edit-agent-header';
import {
  EditAgentForm,
  type EditAgentFormHandle,
} from './edit-agent-form';

interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
}

interface EditAgentPageClientProps {
  agent: Agent;
  user: AuthUser;
}

export function EditAgentPageClient({ agent, user }: EditAgentPageClientProps) {
  const formRef = useRef<EditAgentFormHandle>(null);
  const [formData, setFormData] = useState(() => ({
    name: agent.name,
    description: agent.description ?? '',
    agentPrompt: agent.agentPrompt ?? '',
    isPublic: agent.isPublic,
    vectorStoreId: agent.vectorStoreId ?? undefined,
  }));

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="border-b px-6 py-4">
        <EditAgentHeader
          agent={{ ...agent, name: formData.name }}
          onSubmit={() => formRef.current?.submit()}
          isSubmitting={formRef.current?.isSubmitting || false}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <EditAgentForm
            ref={formRef}
            agent={agent}
            formData={formData}
            onFormDataChange={setFormData}
          />
        </div>
        <div className="hidden md:block flex-1 border-l bg-muted/20">
          <AgentPreview formData={formData} user={user} />
        </div>
      </div>
    </div>
  );
}
