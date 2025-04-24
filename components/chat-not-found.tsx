import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ChatNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Chat Not Found</h2>
      <p className="text-muted-foreground">
        The requested chat could not be found.
      </p>
      <Button asChild>
        <Link href="/chat">Return to Chats</Link>
      </Button>
    </div>
  );
}
