'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AgentPromptEditor({
  agentId,
  initialSaved,
}: {
  agentId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      try {
        if (!saved) {
          const res = await fetch('/api/saved-agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
          });
          if (!res.ok) throw new Error('Failed to save agent');
          setSaved(true);
          toast.success('Agent saved');
        }
      } catch (e: any) {
        toast.error(e?.message || 'Something went wrong');
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isPending}>
          {saved ? 'Saved' : 'Save Agent'}
        </Button>
      </div>
    </div>
  );
}

