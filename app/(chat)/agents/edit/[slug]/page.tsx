'use client';

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { notFound } from 'next/navigation';
import { EditAgentForm, type EditAgentFormHandle } from './edit-agent-form';
import { EditAgentHeader } from './edit-agent-header';
import { AgentPreview } from '../../new/agent-preview';
import type { Agent } from '@/lib/db/schema';

interface EditAgentPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const formRef = useRef<EditAgentFormHandle>(null);
  const { user, loading } = useAuth({ ensureSignedIn: true });
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentPrompt: '',
    isPublic: true,
  });

  useEffect(() => {
    async function loadAgent() {
      try {
        const { slug } = await params;
        const response = await fetch(`/api/agents/${slug}`);

        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            notFound();
          }
          throw new Error('Failed to load agent');
        }

        const agentData = await response.json();
        setAgent(agentData.agent);
        setFormData({
          name: agentData.agent.name,
          description: agentData.agent.description || '',
          agentPrompt: agentData.agent.agentPrompt || '',
          isPublic: agentData.agent.isPublic,
        });
      } catch (error) {
        console.error('Error loading agent:', error);
        notFound();
      } finally {
        setIsLoadingAgent(false);
      }
    }

    if (!loading) {
      loadAgent();
    }
  }, [params, loading]);

  if (loading || isLoadingAgent) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  if (!agent) {
    return notFound();
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="border-b px-6 py-4">
        <EditAgentHeader
          agent={agent}
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
