'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useState, useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { generateSuggestedActions } from '@/lib/ai/actions/generate-suggested-actions';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

interface SuggestedAction {
  title: string;
  label: string;
  action: string;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([
    // {
    //   title: 'What are the advantages',
    //   label: 'of using Next.js?',
    //   action: 'What are the advantages of using Next.js?',
    // },
    // {
    //   title: 'Write code to',
    //   label: `demonstrate djikstra's algorithm`,
    //   action: `Write code to demonstrate djikstra's algorithm`,
    // },
    // {
    //   title: 'Help me write an essay',
    //   label: `about silicon valley`,
    //   action: `Help me write an essay about silicon valley`,
    // },
    // {
    //   title: 'What is the weather',
    //   label: 'in San Francisco?',
    //   action: 'What is the weather in San Francisco?',
    // },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSuggestedActions = async () => {
      setIsLoading(true);
      try {
        const actions = await generateSuggestedActions();
        setSuggestedActions(actions);
      } catch (error) {
        console.error('Failed to load suggested actions:', error);
        // Keep the default actions if loading fails
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestedActions();
  }, []);

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
            disabled={isLoading}
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start disabled:opacity-50"
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
