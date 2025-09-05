'use client';
import { useState } from 'react';
import type { SourceRef } from '@/apps/web/lib/chat/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function SourceCitations({ sources }: { sources: SourceRef[] }) {
  const [visible, setVisible] = useState(true);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="text-xs text-muted-foreground mt-2">
      <div className="flex items-center gap-2 mb-1">
        <Switch id="sources-toggle" checked={visible} onCheckedChange={setVisible} />
        <Label htmlFor="sources-toggle">fontes</Label>
      </div>
      {visible && (
        <ol className="list-decimal list-inside space-y-1">
          {sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener" className="underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
