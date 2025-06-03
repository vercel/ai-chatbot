'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { allChatModels, modelProviders } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

// Simple chevron right component
const ChevronRightIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    width={size}
    viewBox="0 0 16 16"
    style={{ color: 'currentcolor' }}
  >
    <path
      d="M6 12L10 8L6 4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ModelSelector({
  session,
  selectedModelId,
  className,
  onModelChange,
}: {
  session: Session;
  selectedModelId: string;
  onModelChange?: (modelId: string) => Promise<void>;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = allChatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  // Get the provider name for the selected model
  const selectedProvider = useMemo(() => {
    if (!selectedChatModel) return null;
    return modelProviders.find((provider) =>
      provider.models.some((model) => model.id === selectedChatModel.id),
    );
  }, [selectedChatModel]);

  // Get available providers that have at least one available model
  const availableProviders = useMemo(() => {
    return modelProviders
      .map((provider) => ({
        ...provider,
        models: provider.models.filter((model) =>
          availableChatModelIds.includes(model.id),
        ),
      }))
      .filter((provider) => provider.models.length > 0);
  }, [availableChatModelIds]);

  const handleModelSelect = (modelId: string) => {
    setOpen(false);
    startTransition(async () => {
      setOptimisticModelId(modelId);
      if (onModelChange) {
        await onModelChange(modelId);
      } else {
        // Fallback to the old behavior
        await saveChatModelAsCookie(modelId);
      }
    });
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
          data-testid="model-selector"
          variant="outline"
          className="md:px-3 md:h-[34px] font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800"
        >
          <span className="text-sm">
            {selectedProvider?.name || 'ChatGPT'}{' '}
            {selectedChatModel?.name?.split(' ')[0] || 'GPT-4o'}
          </span>
          <div className="ml-1 opacity-50">
            <ChevronDownIcon size={12} />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-[280px] p-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Models
          </div>

          {availableProviders.map((provider) => (
            <DropdownMenuSub key={provider.id}>
              <DropdownMenuSubTrigger className="px-3 py-2 cursor-default hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150">
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {provider.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {provider.models.length} model
                      {provider.models.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="opacity-50">
                    <ChevronRightIcon size={12} />
                  </div>
                </div>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="min-w-[300px] p-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-lg ml-1">
                {provider.models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => handleModelSelect(model.id)}
                    className="px-3 py-3 cursor-default hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
                    data-active={model.id === optimisticModelId}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-medium text-black dark:text-white">
                          {model.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {model.description}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'transition-opacity duration-200',
                          model.id === optimisticModelId
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      >
                        <CheckCircleFillIcon size={16} />
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
