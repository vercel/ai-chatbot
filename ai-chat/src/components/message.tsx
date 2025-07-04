'use client';

import { type Dispatch, memo, type SetStateAction, useState } from 'react';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { cn, generateUUID } from '@ai-chat/lib/utils';
import {
  MessageRoles,
  type Chat,
  type Message,
  type Source,
} from '@ai-chat/app/api/models';
import { PencilEditIcon, SparklesIcon } from './icons';
import { MessageActions } from './message-actions';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import { DocumentToolCall, DocumentToolResult } from './document';
import { Markdown } from './markdown';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { DocumentPreview } from './document-preview';
import { useTranslation } from 'react-i18next';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: Message;
  vote: any | undefined;
  isLoading: boolean;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('edit');
  // const sourcesEntries: [string, Source][] = Object.entries(
  //   message?.sources as Record<number, Source>,
  // );

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
          {message.role === MessageRoles.Assistant && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96':
                message.role === MessageRoles.Assistant &&
                requiresScrollPadding,
            })}
          >
            {/*
            {sourcesEntries && sourcesEntries.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {sourcesEntries.map(([key, source]) => (
                  <PreviewAttachment key={key} attachment={source} />
                ))}
              </div>
            )}
            */}

            {message.content && message.content.length > 0 && (
              <div
                key={`message-${message.id}`}
                className="flex flex-row gap-2 items-end justify-end"
              >
                {/* TODO: this feature might not be available at the end */}
                {/* 
                {message.role === MessageRoles.User && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid="message-edit-button"
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}
                 */}

                <div
                  data-testid="message-content"
                  className={cn('flex flex-col max-w-full gap-4', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                      message.role === MessageRoles.User,
                  })}
                >
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const { t } = useTranslation();
  const role = MessageRoles.Assistant;

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            {t('chatLog.thinkingPrompt')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
