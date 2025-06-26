'use client';

import cx from 'classnames';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { SparklesIcon } from './icons';
import equal from 'fast-deep-equal';
import { MessageContainer } from './messages/message-container';
import { MessageAvatar } from './messages/message-avatar';
import { MessageContent } from './messages/message-content';
import type { BaseMessageProps } from './messages/types';

const PurePreviewMessage = (props: BaseMessageProps) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <MessageContainer message={props.message} mode={mode}>
      <MessageAvatar role={props.message.role} />
      <MessageContent {...props} mode={mode} setMode={setMode} />
    </MessageContainer>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
      style={{}}
    >
      <div className="w-full mx-auto max-w-3xl px-4 group/message min-h-96">
        <div
          className={cx(
            'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
            {
              'group-data-[role=user]/message:bg-muted': true,
            },
          )}
        >
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <SparklesIcon size={14} />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col gap-4 text-muted-foreground">
              Hmm...
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
