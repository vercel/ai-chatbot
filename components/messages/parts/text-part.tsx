'use client';

import { cn, sanitizeText } from '@/lib/utils';
import { Markdown } from '../../markdown';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { MessageEditor } from '../../message-editor';
import { PencilEditIcon } from '../../icons';
import type { UIMessage } from 'ai';
import type { MessageMode, BaseMessageProps } from '../types';

interface TextPartProps extends MessageMode {
  message: UIMessage;
  text: string;
  partKey: string;
  isReadonly: boolean;
  setMessages: BaseMessageProps['setMessages'];
  reload: BaseMessageProps['reload'];
}

export function TextPart({
  message,
  text,
  partKey,
  mode,
  setMode,
  isReadonly,
  setMessages,
  reload,
}: TextPartProps) {
  if (mode === 'view') {
    return (
      <div key={partKey} className="flex flex-row gap-2 items-start">
        {message.role === 'user' && !isReadonly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                onClick={() => setMode('edit')}
              >
                <PencilEditIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        )}

        <div
          data-testid="message-content"
          className={cn('flex flex-col gap-4', {
            'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
              message.role === 'user',
          })}
        >
          <Markdown>{sanitizeText(text)}</Markdown>
        </div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div key={partKey} className="flex flex-row gap-2 items-start">
        <div className="size-8" />
        <MessageEditor
          key={message.id}
          message={message}
          setMode={setMode}
          setMessages={setMessages}
          reload={reload}
        />
      </div>
    );
  }

  return null;
}