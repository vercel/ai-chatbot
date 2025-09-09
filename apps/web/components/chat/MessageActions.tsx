import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function MessageActions({ message }: { readonly message: any }) {
  const [pinned, setPinned] = useState(false);

  return (
    <div className="flex gap-1" aria-label="ações da mensagem">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText('Mensagem');
        }}
      >
        📋
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setPinned((p: boolean) => !p);
        }}
        aria-pressed={pinned}
      >
        📌
      </Button>
    </div>
  );
}
