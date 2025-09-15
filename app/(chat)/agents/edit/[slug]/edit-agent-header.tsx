'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/lib/db/schema';

interface EditAgentHeaderProps {
  agent: Agent;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function EditAgentHeader({
  agent,
  onSubmit,
  isSubmitting,
}: EditAgentHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Edit Agent</h1>
        <p className="text-sm text-muted-foreground">
          Update &ldquo;{agent.name}&rdquo; configuration and settings
        </p>
      </div>
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/agents')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Agent'}
        </Button>
      </div>
    </div>
  );
}
