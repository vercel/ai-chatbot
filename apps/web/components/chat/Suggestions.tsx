'use client';
import { useChatContext } from '@/apps/web/lib/chat/context';
import { Button } from '@/components/ui/button';

export function Suggestions({ onSelect }: { onSelect: (text: string) => void }) {
  const { messages } = useChatContext();
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggestions = (last as any)?.suggestions as string[] | undefined;
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 p-2" data-testid="suggestions">
      {suggestions.map((s) => (
        <Button
          key={s}
          size="sm"
          variant="secondary"
          onClick={() => onSelect(s)}
        >
          {s}
        </Button>
      ))}
    </div>
  );
}
