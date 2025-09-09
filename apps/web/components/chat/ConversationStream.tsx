'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useChatContext } from '@/apps/web/lib/chat/context';

export function ConversationStream() {
  const { messages, errorState } = useChatContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!errorState) return;
    const delay = Math.min(1000 * 2 ** retry, 10000);
    const id = setTimeout(() => {
      // Retry logic can be implemented later
      setRetry((r) => r + 1);
    }, delay);
    return () => clearTimeout(id);
  }, [errorState, retry]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 overflow-y-auto p-4"
      aria-live="polite"
      data-testid="conversation-stream"
    >
      {messages.map((m) => (
        <div key={m.id} className="flex flex-col">
          <div
            className={clsx(
              'rounded-md px-3 py-2 text-sm',
              m.role === 'user'
                ? 'bg-primary text-primary-foreground self-end'
                : 'bg-muted'
            )}
          >
            {/* Simplified content display */}
            Mensagem {m.role}
          </div>
        </div>
      ))}
    </div>
  );
}
