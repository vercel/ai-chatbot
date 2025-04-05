'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
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

  const handleSelectKnowledge = (selectedIds: string[]) => {
    setSelectedKnowledgeIds(selectedIds);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200 ml-1"
            onClick={(event) => {
              event.preventDefault();
              setIsModalOpen(true);
            }}
            disabled={disabled}
            variant="ghost"
            aria-label="Select knowledge sources"
          >
            <Database size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Select knowledge sources
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
