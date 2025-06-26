'use client';

import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';
import { MessageAttachments } from './message-attachments';
import { MessageParts } from './message-parts';
import { MessageActions } from '../message-actions';
import type { BaseMessageProps, MessageMode } from './types';
import type { Vote } from '@/lib/db/schema';

interface MessageContentProps extends MessageMode {
  message: UIMessage;
  chatId: string;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  setMessages: BaseMessageProps['setMessages'];
  reload: BaseMessageProps['reload'];
}

export function MessageContent({
  message,
  chatId,
  vote,
  isLoading,
  isReadonly,
  requiresScrollPadding,
  mode,
  setMode,
  setMessages,
  reload,
}: MessageContentProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 w-full', {
        'min-h-96': message.role === 'assistant' && requiresScrollPadding,
      })}
    >
      <MessageAttachments message={message} />

      <MessageParts
        message={message}
        mode={mode}
        setMode={setMode}
        isLoading={isLoading}
        isReadonly={isReadonly}
        setMessages={setMessages}
        reload={reload}
      />

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
  );
}
