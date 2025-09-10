import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { ThumbDownIcon, ThumbUpIcon, PencilEditIcon } from './icons';
import { Copy, Check } from 'lucide-react';
import { Actions, Action } from './elements/actions';
import { memo, useState } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  setMode,
  mode,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: 'view' | 'edit') => void;
  mode: 'view' | 'edit';
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  if (isLoading) return null;

  const textFromParts = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // User messages get edit (on hover) and copy actions
  if (message.role === 'user') {
    return (
      <Actions className="-mr-0.5 justify-end">
        <div
          className={cn(
            'opacity-100 md:opacity-0 transition-opacity group-hover/message:opacity-100 gap-1',
            {
              'md:opacity-100': mode === 'edit',
            },
          )}
        >
          {setMode && (
            <Action tooltip="Edit" onClick={() => setMode('edit')}>
              <PencilEditIcon />
            </Action>
          )}
          <Action tooltip="Copy" onClick={handleCopy}>
            <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
            <Copy
              className={`h-4 w-4 transition-all duration-300 ${
                copied ? 'scale-0' : 'scale-100'
              }`}
            />
            <Check
              className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
                copied ? 'scale-100' : 'scale-0'
              }`}
            />
          </Action>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5">
      <Action tooltip="Copy" onClick={handleCopy}>
        <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
        <Copy
          className={`h-4 w-4 transition-all duration-300 ${
            copied ? 'scale-0' : 'scale-100'
          }`}
        />
        <Check
          className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
            copied ? 'scale-100' : 'scale-0'
          }`}
        />
      </Action>

      <Action
        tooltip="Upvote Response"
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={async () => {
          const upvote = fetch('/api/vote', {
            method: 'PATCH',
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: 'up',
            }),
          });

          toast.promise(upvote, {
            loading: 'Upvoting Response...',
            success: () => {
              mutate<Array<Vote>>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) return [];

                  const votesWithoutCurrent = currentVotes.filter(
                    (vote) => vote.messageId !== message.id,
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: true,
                    },
                  ];
                },
                { revalidate: false },
              );

              return 'Upvoted Response!';
            },
            error: 'Failed to upvote response.',
          });
        }}
      >
        <ThumbUpIcon />
      </Action>

      <Action
        tooltip="Downvote Response"
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={async () => {
          const downvote = fetch('/api/vote', {
            method: 'PATCH',
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: 'down',
            }),
          });

          toast.promise(downvote, {
            loading: 'Downvoting Response...',
            success: () => {
              mutate<Array<Vote>>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) return [];

                  const votesWithoutCurrent = currentVotes.filter(
                    (vote) => vote.messageId !== message.id,
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: false,
                    },
                  ];
                },
                { revalidate: false },
              );

              return 'Downvoted Response!';
            },
            error: 'Failed to downvote response.',
          });
        }}
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.mode !== nextProps.mode) return false;

    return true;
  },
);
