'use client';
import { useEffect, useState } from 'react';
import { useChatContext } from '@/apps/web/lib/chat/context';
import type { ChatMessage } from '@/apps/web/lib/chat/types';
import { Button } from '@/components/ui/button';

const LOG_KEY = 'chat-action-log';

function logAction(id: string, action: string) {
  const raw = localStorage.getItem(LOG_KEY);
  const data: Record<string, Array<{ action: string; ts: number }>> = raw
    ? JSON.parse(raw)
    : {};
  data[id] = [...(data[id] || []), { action, ts: Date.now() }];
  localStorage.setItem(LOG_KEY, JSON.stringify(data));
}

export function MessageActions({ message }: { message: ChatMessage }) {
  const { append, reload } = useChatContext();
  const [pinned, setPinned] = useState(message.pinned ?? false);

  useEffect(() => {
    message.pinned = pinned;
  }, [pinned, message]);

  const text = message.content;

  return (
    <div className="flex gap-1" aria-label="ações da mensagem">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          append({ id: message.id + '-r', role: 'user', content: text });
          logAction(message.id, 'regenerate');
        }}
      >
        🔄
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(text);
          logAction(message.id, 'copy');
        }}
      >
        📋
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (navigator.share) {
            navigator.share({ text });
          } else {
            navigator.clipboard.writeText(text);
          }
          logAction(message.id, 'share');
        }}
      >
        📤
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setPinned((p) => !p);
          logAction(message.id, 'pin');
        }}
        aria-pressed={pinned}
      >
        📌
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          append({ id: message.id + '-c', role: 'user', content: `compare: ${text}` });
          logAction(message.id, 'compare');
        }}
      >
        ⚖️
      </Button>
    </div>
  );
}
