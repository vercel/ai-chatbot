'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useMemo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  // Calculate current month one year ago for YoY comparison
  const yearAgoMonth = useMemo(() => {
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    return yearAgo.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }, []);

  const suggestedActions = [
    {
      title: 'Show me recent',
      label: 'backblasts from ao_darkhorse',
      action: 'Show me recent backblasts from ao_darkhorse',
    },
    {
      title: 'Who are the most',
      label: 'active Qs this month?',
      action: 'Who are the most active Qs this month?',
    },
    {
      title: 'Search for backblasts',
      label: 'containing "burpees"',
      action: 'Search for backblasts containing "burpees"',
    },
    {
      title: 'What are the stats',
      label: `for ${yearAgoMonth}?`,
      action: `What are the statistics for ${yearAgoMonth}?`,
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
