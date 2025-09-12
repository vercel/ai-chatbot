'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export interface CreateAgentFormHandle {
  submit: () => void;
  isSubmitting: boolean;
}

interface CreateAgentFormProps {
  formData: {
    name: string;
    description: string;
    agentPrompt: string;
    isPublic: boolean;
  };
  onFormDataChange: (data: {
    name: string;
    description: string;
    agentPrompt: string;
    isPublic: boolean;
  }) => void;
}

export const CreateAgentForm = forwardRef<
  CreateAgentFormHandle,
  CreateAgentFormProps
>(({ formData, onFormDataChange }, ref) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create agent');
      }

      const agent = await response.json();
      toast.success('Agent created successfully!');
      router.push(`/agents/${agent.slug}`);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create agent',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    isSubmitting,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Agent Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure your agent&apos;s behavior and settings
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="My Custom Agent"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="A brief description of what this agent does"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agentPrompt">Agent Prompt</Label>
          <Textarea
            id="agentPrompt"
            value={formData.agentPrompt}
            onChange={(e) => handleInputChange('agentPrompt', e.target.value)}
            placeholder="You are a helpful AI assistant that..."
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This prompt will be used as the system message for this agent
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) =>
              handleInputChange('isPublic', checked)
            }
          />
          <Label htmlFor="isPublic">Make this agent public</Label>
        </div>
      </form>
    </div>
  );
});

CreateAgentForm.displayName = 'CreateAgentForm';
