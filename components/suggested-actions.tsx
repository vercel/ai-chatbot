'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { FeatureCard } from './feature-card';
import Github from '@/components/icons/github';
import Gmail from '@/components/icons/gmail';
import Slack from '@/components/icons/slack';
import Linkedin from '@/components/icons/linkedIn';
import { cn } from '@/lib/utils';
import Notion from './icons/notion';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

type SuggestedAction = {
  title: string;
  subtitle: string;
  action: string;
  icon: React.ReactNode;
  id: string;
  className?: string;
};

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions: SuggestedAction[] = [
    {
      title: 'Read my emails',
      subtitle: 'and summarize them',
      action: 'Read my last 10 emails and summarize them',
      icon: <Gmail className="size-4 sm:size-5 " />,
      id: 'gmail',
    },
    {
      title: 'Check Slack messages',
      subtitle: 'in the #general channel',
      action: 'Check the last 10 Slack messages in the #general channel',
      icon: <Slack className="size-4 sm:size-5 " />,
      id: 'slack',
    },
    {
      title: 'Star the arcadeai/arcade-ai',
      subtitle: 'repo on GitHub',
      action: 'Star the arcadeai/arcade-ai repo on GitHub',
      icon: <Github className="size-4 sm:size-5 " />,
      id: 'github',
    },
    {
      title: 'Publish a new post on LinkedIn',
      subtitle: "saying that I'm testing Arcade.dev",
      action: 'Publish a new post on LinkedIn saying "Arcade.dev is awesome!"',
      icon: <Linkedin className="size-4 sm:size-5 " />,
      id: 'linkedin',
      className: 'col-span-12 sm:col-span-6 md:col-span-6',
    },
    {
      title: 'Create a page in Notion',
      subtitle: 'with a chicken recipe',
      action: 'Create a new Notion page with a chicken recipe',
      icon: <Notion className="size-4 sm:size-5" />,
      id: 'notion',
      className: 'col-span-12 sm:col-span-6 md:col-span-6',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid grid-cols-12 gap-4 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.id}-${index}`}
          className={cn(
            'col-span-12 sm:col-span-6 md:col-span-4',
            index > 1 ? 'hidden sm:block' : 'block',
            suggestedAction.className,
          )}
        >
          {/* biome-ignore lint/nursery/noStaticElementInteractions: <explanation> */}
          <div
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
          >
            <FeatureCard
              icon={suggestedAction.icon}
              title={suggestedAction.title}
              subtitle={suggestedAction.subtitle}
              id={suggestedAction.id}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
