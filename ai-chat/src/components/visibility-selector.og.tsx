'use client';

import { useMemo, useState } from 'react';
import { cn } from '@ai-chat/lib/utils';
import { Button } from './ui/button';
import {
  BotIcon,
  CheckCircleFillIcon,
  ChevronDownIcon,
  EyeIcon,
} from './icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useCoreContext } from '@ai-chat/app/core-context';
import {
  ChatModeKeyOptions,
  type KnowledgeBaseKeyOptions,
  type LanguageModelKeyOptions,
} from '@ai-chat/app/api/models';

export type VisibilityType = 'private' | 'public';

export function VisibilitySelector({
  chatId,
  className,
  selectedVisibilityType,
  selectedModeId,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  selectedModeId: ChatModeKeyOptions;
} & React.ComponentProps<typeof Button>) {
  const { knowledgeBases, languageModels } = useCoreContext();
  const [open, setOpen] = useState(false);

  const visibilities =
    (selectedModeId === ChatModeKeyOptions.Documents
      ? knowledgeBases?.map((kb) => {
          return {
            id: kb.key,
            label: kb.display_name,
            description: kb.short_description,
            icon: <EyeIcon />,
          };
        })
      : languageModels?.map((lm) => {
          return {
            id: lm.key,
            label: lm.display_name,
            description: lm.short_description,
            icon: <BotIcon />,
          };
        })) ?? [];

  const [visibilityType, setVisibilityType] = useState<
    LanguageModelKeyOptions | KnowledgeBaseKeyOptions
  >(visibilities[0].id);

  const selectedVisibility = useMemo(
    () => visibilities.find((visibility) => visibility.id === visibilityType),
    [visibilityType],
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
          data-testid="visibility-selector"
          variant="outline"
          className="hidden md:flex md:px-2 md:h-[34px]"
        >
          {selectedVisibility?.icon}
          {selectedVisibility?.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            data-testid={`visibility-selector-item-${visibility.id}`}
            key={visibility.id}
            onSelect={() => {
              setVisibilityType(visibility.id);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={visibility.id === visibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-muted-foreground">
                  {visibility.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
