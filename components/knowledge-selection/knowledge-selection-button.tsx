'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookIcon } from '@/components/icons';
import { KnowledgeSelectionModal } from './knowledge-selection-modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from 'usehooks-ts';

interface KnowledgeSelectionButtonProps {
  chatId: string;
  disabled?: boolean;
}

export function KnowledgeSelectionButton({ chatId, disabled = false }: KnowledgeSelectionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useLocalStorage<string[]>(
    `chat-${chatId}-knowledge-selection`,
    []
  );
  // Use client-side-only state to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  const [countBadge, setCountBadge] = useState(0);

  // Only run after component mounts on client
  useEffect(() => {
    setHasMounted(true);
    setCountBadge(selectedKnowledgeIds.length);
  }, [selectedKnowledgeIds.length]);

  const handleSelectKnowledge = (selectedIds: string[]) => {
    setSelectedKnowledgeIds(selectedIds);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={`rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200 ml-1 relative ${selectedKnowledgeIds.length === 0 ? 'text-red-500' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              setIsModalOpen(true);
            }}
            disabled={disabled}
            variant="ghost"
            aria-label="Select knowledge sources"
          >
            <BookIcon size={18} />
            {hasMounted && countBadge > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2A5B34] text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                {countBadge}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {hasMounted && (selectedKnowledgeIds.length === 0 ? 'No knowledge sources selected' : `${selectedKnowledgeIds.length} knowledge source${selectedKnowledgeIds.length === 1 ? '' : 's'} selected`)}
        </TooltipContent>
      </Tooltip>

      <KnowledgeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectKnowledge}
        initialSelection={selectedKnowledgeIds}
      />
    </>
  );
}
