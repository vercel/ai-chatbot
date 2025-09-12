'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AgentPromptEditor({
  agentId,
  initialSaved,
  initialCustomPrompt,
}: {
  agentId: string;
  initialSaved: boolean;
  initialCustomPrompt: string;
}) {
  const [customPrompt, setCustomPrompt] = useState(initialCustomPrompt);
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      try {
        if (!saved) {
          const res = await fetch('/api/saved-agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, customPrompt }),
          });
          if (!res.ok) throw new Error('Failed to save agent');
          setSaved(true);
          toast.success('Agent saved');
        } else {
          const res = await fetch(`/api/saved-agents/${agentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customPrompt }),
          });
          if (!res.ok) throw new Error('Failed to update prompt');
          toast.success('Prompt updated');
        }
      } catch (e: any) {
        toast.error(e?.message || 'Something went wrong');
      }
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Write a custom prompt for this agent..."
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="min-h-[180px]"
      />
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isPending}>
          {saved ? 'Save Prompt' : 'Save Agent'}
        </Button>
      </div>
    </div>
  );
}

