'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';
import type { MessageMode } from './types';

interface MessageContainerProps {
  message: UIMessage;
  mode: MessageMode['mode'];
  children: React.ReactNode;
}

export function MessageContainer({
  message,
  mode,
  children,
}: MessageContainerProps) {
  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
