'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import {
  CreateAgentForm,
  type CreateAgentFormHandle,
} from './create-agent-form';
import { CreateAgentHeader } from './create-agent-header';
import { AgentPreview } from './agent-preview';

export default function NewAgentPage() {
  const formRef = useRef<CreateAgentFormHandle>(null);
  const { user, loading } = useAuth({ ensureSignedIn: true });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentPrompt: '',
    isPublic: true,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="border-b px-6 py-4">
        <CreateAgentHeader
          onSubmit={() => formRef.current?.submit()}
          isSubmitting={formRef.current?.isSubmitting || false}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <CreateAgentForm
            ref={formRef}
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
