'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CreateAgentHeaderProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function CreateAgentHeader({
  onSubmit,
  isSubmitting,
}: CreateAgentHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Create Agent</h1>
        <p className="text-sm text-muted-foreground">
          Create a new AI agent with custom prompts and settings
        </p>
      </div>
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Agent'}
        </Button>
      </div>
    </div>
  );
}
