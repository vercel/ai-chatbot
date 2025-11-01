'use client';

import type { ChatMessage } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { memo } from 'react';
import { ChevronDownIcon } from '../icons';

export interface QueuePanelProps {
  items: Array<ChatMessage['parts']>;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: (index: number) => void;
}

function PureQueuePanel({ items, isOpen, onToggle, onRemove }: QueuePanelProps) {
  if (items.length === 0) return null;

  return (
    <div className='rounded-t-xl border border-border border-b-0 bg-background px-3 pt-2 pb-2 shadow-xs'>
      <button
        type="button"
        className='flex w-full items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted'
        onClick={onToggle}
      >
        <span>
          {items.length} Queued
        </span>
        <span className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
          <ChevronDownIcon size={14} />
        </span>
      </button>
      {isOpen && (
        <ul className='mt-2 max-h-40 overflow-y-auto pr-1'>
          {items.map((parts, index) => {
            const summary = (() => {
              const textParts = parts.filter((p) => 'type' in p && p.type === 'text') as Array<{ type: 'text'; text: string }>;
              const text = textParts.map((p) => p.text).join(' ').trim();
              if (text) return text;
              return '(queued message)';
            })();

            return (
              <li key={`${index}-${summary.slice(0, 50)}`} className='group flex items-center gap-2 py-1 px-2 text-sm text-muted-foreground rounded-md hover:bg-muted transition-colors'>
                <span className='mt-1 inline-block size-2.5 rounded-full border border-muted-foreground/50'></span>
                <span className='line-clamp-1 break-words grow'>{summary}</span>
                <button
                  type='button'
                  className='invisible group-hover:visible rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  aria-label='Remove from queue'
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const QueuePanel = memo(PureQueuePanel);


