'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ShareIcon, CheckCircleFillIcon, CopyIcon } from './icons';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import type { VisibilityType } from './visibility-selector';

export function ShareButton({
  chatId,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType: selectedVisibilityType,
  });

  const handleShare = async () => {
    // First ensure the chat is public
    if (visibilityType === 'private') {
      setVisibilityType('public');
    }

    // Copy the current URL to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }

    setOpen(false);
  };

  const handleMakePrivate = () => {
    setVisibilityType('private');
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="share-button"
          variant="outline"
          className="hidden md:flex md:px-3 md:h-[34px] font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800"
        >
          <ShareIcon size={14} />
          <span className="text-sm ml-2">Share</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[200px] p-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="py-1">
          <DropdownMenuItem
            onSelect={handleShare}
            className="px-3 py-2 cursor-default hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
          >
            <div className="flex items-center gap-3 w-full">
              <CopyIcon size={16} />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-black dark:text-white">
                  {copied ? 'Link copied!' : 'Copy link'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Share this conversation
                </span>
              </div>
              {copied && <CheckCircleFillIcon size={16} />}
            </div>
          </DropdownMenuItem>

          {visibilityType === 'public' && (
            <DropdownMenuItem
              onSelect={handleMakePrivate}
              className="px-3 py-2 cursor-default hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-4 h-4" /> {/* Spacer for alignment */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-black dark:text-white">
                    Make private
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Stop sharing this chat
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
