'use client';
import { useState } from 'react';
import type { ToolStep } from '@/apps/web/lib/chat/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckIcon, Loader2Icon } from 'lucide-react';

export function TaskFeed({ steps }: { steps: ToolStep[] }) {
  return (
    <div className="space-y-2" data-testid="task-feed">
      {steps.map((step) => (
        <TaskItem key={step.id} step={step} />
      ))}
    </div>
  );
}

function TaskItem({ step }: { step: ToolStep }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded p-2">
      <CollapsibleTrigger className="flex items-center gap-2">
        {step.status === 'done' ? (
          <CheckIcon className="h-4 w-4 text-green-600" />
        ) : step.status === 'running' ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-xs">⏳</span>
        )}
        <span className="text-sm">{step.label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 text-xs">
        {step.logs?.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
