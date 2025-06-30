'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { cn } from '@ai-chat/lib/utils';
import type { ChatMode, ChatModeKeyOptions } from '@ai-chat/app/api/models';
import { useCoreContext } from '@ai-chat/app/core-context';
import { saveChatModeAsCookie } from '@ai-chat/app/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModeSelector({
  selectedModeId: selectedModeKey,
  className,
}: {
  selectedModeId: ChatModeKeyOptions;
} & React.ComponentProps<typeof Button>) {
  const { chatModes } = useCoreContext();
  const [open, setOpen] = useState(false);
  const [optimisticModeKey, setOptimisticModeKey] =
    useOptimistic(selectedModeKey);

  const selectedChatMode = useMemo(
    () =>
      chatModes.find(
        (chatMode: ChatMode) => chatMode.key === optimisticModeKey,
      ),
    [optimisticModeKey],
  );

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
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatMode?.display_name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {chatModes.map((chatMode: ChatMode) => {
          const { key } = chatMode;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${key}`}
              key={key}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModeKey(key);
                  saveChatModeAsCookie(key);
                });
              }}
              data-active={key === optimisticModeKey}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{chatMode.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {chatMode.description}
                  </div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
