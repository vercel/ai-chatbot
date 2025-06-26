'use client';

import { SparklesIcon } from '../icons';

interface MessageAvatarProps {
  role: 'user' | 'assistant' | 'system' | 'data';
}

export function MessageAvatar({ role }: MessageAvatarProps) {
  if (role !== 'assistant') return null;

  return (
    <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
      <div className="translate-y-px">
        <SparklesIcon size={14} />
      </div>
    </div>
  );
}