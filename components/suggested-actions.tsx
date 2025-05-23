'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Get the best flight options to Tokyo next week',
      label: 'leaving Monday or Tuesday, Haneda preferred but Narita is fine',
      action: `Get the best flight options to Tokyo next week leaving Monday or Tuesday, Haneda preferred but Narita is fine`,
    },
    {
      title: 'Find Airbnbs available for a group of 4 in Chamonix',
      label: `for one week next month, limit $500 per night`,
      action: `Find Airbnbs available for a group of 4 in Chamonix for one week next month, limit $500 per night`,
    },
    {
      title: 'Write an email like the client',
      label: `asking for an update on a recent project`,
      action: `Write an email like the client asking for an update on a recent project`,
    },
    {
      title: 'Craft an AI product strategy memo',
      label: `based on what you know about the client's company`,
      action: `Craft an AI product strategy memo based on what you know about the client's company`,
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

export const SuggestedActions = memo(PureSuggestedActions, () => true);
