'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XIcon, MessageCircleIcon } from 'lucide-react';

interface TranscriptHeaderProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  totalTranscripts: number;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
}

export function TranscriptHeader({
  searchTerm,
  onSearchTermChange,
  totalTranscripts,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
}: TranscriptHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
        <Input
          placeholder="Search transcripts..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalTranscripts} transcript{totalTranscripts !== 1 ? 's' : ''} total
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isSelectionMode && selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
        )}
        <Button
          onClick={onToggleSelectionMode}
          variant={isSelectionMode ? 'secondary' : 'default'}
          size="sm"
          className="flex items-center gap-2"
        >
          {isSelectionMode ? (
            <>
              <XIcon className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <MessageCircleIcon className="size-4" />
              Chat with meetings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
