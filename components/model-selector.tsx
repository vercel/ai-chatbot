'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { allChatModels } from '@/lib/ai/models';
import { providers, getModelById } from '@/lib/ai/provider-configs';
import { myProvider } from '@/lib/ai/providers';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('xai');
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = allChatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  const selectedChatModel = useMemo(
    () => getModelById(optimisticModelId) || availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  // Group models by provider for clean organization
  const modelsByProvider = useMemo(() => {
    const grouped: Array<{ provider: typeof providers[0]; models: typeof availableChatModels }> = [];
    
    providers.forEach(provider => {
      const providerModels = availableChatModels.filter(
        model => model.providerId === provider.id
      );
      if (providerModels.length > 0) {
        grouped.push({ provider, models: providerModels });
      }
    });
    
    return grouped;
  }, [availableChatModels]);

  // Set initial provider based on selected model (only on mount)
  useEffect(() => {
    if (selectedChatModel?.providerId) {
      const hasProvider = modelsByProvider.some(({ provider }) => provider.id === selectedChatModel.providerId);
      if (hasProvider) {
        setSelectedProvider(selectedChatModel.providerId);
      }
    }
  }, []); // Empty dependency array - only run on mount

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
          {selectedChatModel?.name || 'Select Model'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[600px] p-0" key={selectedProvider}>
        <div className="border-b">
          <div className="flex">
            {modelsByProvider.map(({ provider }) => (
              <button
                key={provider.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedProvider(provider.id);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium border-b-2 transition-colors",
                  selectedProvider === provider.id
                    ? "border-primary bg-background text-foreground"
                    : "border-transparent hover:bg-accent text-muted-foreground"
                )}
              >
               {/*  <span className="font-mono font-bold text-base mr-1">{provider.icon}</span>*/}
                <span>{provider.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {modelsByProvider
            .find(({ provider }) => provider.id === selectedProvider)
            ?.models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                data-testid={`model-selector-item-${model.id}`}
                onSelect={() => {
                  setOpen(false);
                  startTransition(() => {
                    setOptimisticModelId(model.id);
                    saveChatModelAsCookie(model.id);
                  });
                }}
                data-active={model.id === optimisticModelId}
                asChild
              >
                <button
                  type="button"
                  className="gap-4 group/item flex flex-row justify-between items-center w-full"
                >
                  <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      {model.capabilities.includes('vision') && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Vision capable" />
                      )}
                      {model.capabilities.includes('reasoning') && (
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" title="Advanced reasoning" />
                      )}
                      {model.capabilities.includes('fast') && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Fast inference" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {model.description}
                    </div>
                  </div>

                  <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
