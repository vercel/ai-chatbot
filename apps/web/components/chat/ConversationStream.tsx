'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useChatContext } from '@/apps/web/lib/chat/context';
import { MessageActions } from './MessageActions';
import { SourceCitations } from './SourceCitations';
import { extractLinks } from '@/apps/web/lib/chat/links';
import { LinkCard } from '@/apps/web/components/canvas/LinkCard';

export function ConversationStream() {
  const { messages, isLoading, errorState, reload } = useChatContext();
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
      reload();
      setRetry((r) => r + 1);
    }, delay);
    return () => clearTimeout(id);
  }, [errorState, reload, retry]);

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
            {m.content}
          </div>
          {extractLinks(m.content).length > 0 && (
            <div className="mt-1 space-y-1">
              {extractLinks(m.content).map((l) => (
                <LinkCard key={l} url={l} />
              ))}
            </div>
          )}
          {m.role === 'assistant' && <MessageActions message={m} />}
          {m.sources && <SourceCitations sources={m.sources} />}
        </div>
      ))}
      {isLoading && (
        <div
          className="text-sm text-muted-foreground"
          aria-label="digitando"
        >
          ...
        </div>
      )}
    </div>
  );
}
