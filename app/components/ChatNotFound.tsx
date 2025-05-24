import Link from 'next/link';
import { Button } from './ui/button';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function ChatNotFound() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <ExclamationTriangleIcon className="size-6" />
        <h2 className="text-lg font-semibold">Chat Not Found</h2>
      </div>
      <p className="text-muted-foreground">
        The chat you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
