'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels, type ChatModel } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

interface ProviderData {
  name: string;
  models: ChatModel[];
}

interface ModelsResponse {
  providers: {
    openai: ProviderData;
    xai: ProviderData;
  };
  error: string | null;
}

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providersData, setProvidersData] = useState<Record<string, ProviderData> | null>(null);

  // Fetch models from API
  useEffect(() => {
    async function fetchModels() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/models');
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        const data: ModelsResponse = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setProvidersData(data.providers);
      } catch (err: any) {
        console.error('Failed to fetch models:', err);
        setError(err.message || 'Failed to load models');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchModels();
  }, []);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // Use fetched models if available, otherwise fall back to static list
  const availableModels = useMemo(() => {
    if (providersData) {
      // Flatten all models from all providers
      const allModels = Object.values(providersData).flatMap(provider => provider.models);
      // Filter by user's entitlements
      return allModels.filter(model => availableChatModelIds.includes(model.id));
    } else {
      // Fall back to static list
      return chatModels.filter(model => availableChatModelIds.includes(model.id));
    }
  }, [providersData, availableChatModelIds]);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    if (providersData) {
      const result: Record<string, { name: string, models: ChatModel[] }> = {};
      
      // Initialize with empty arrays for each provider
      Object.keys(providersData).forEach(providerId => {
        result[providerId] = { 
          name: providersData[providerId].name,
          models: []
        };
      });
      
      // Populate with available models
      availableModels.forEach(model => {
        if (result[model.provider]) {
          result[model.provider].models.push(model);
        }
      });
      
      return result;
    } else {
      // Fall back to static grouping
      const grouped: Record<string, { name: string, models: ChatModel[] }> = {
        openai: { name: 'OpenAI', models: [] },
        xai: { name: 'xAI', models: [] }
      };
      
      availableModels.forEach(model => {
        grouped[model.provider].models.push(model);
      });
      
      return grouped;
    }
  }, [providersData, availableModels]);

  const selectedChatModel = useMemo(
    () => availableModels.find(model => model.id === optimisticModelId),
    [optimisticModelId, availableModels],
  );

  return (
    <div className="flex flex-col items-start">
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
            disabled={isLoading}
          >
            {isLoading ? 'Loading models...' : selectedChatModel?.name || 'Select model'}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          {error ? (
            <div className="p-2 text-sm text-red-500">
              Error loading models: {error}
            </div>
          ) : isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Loading available models...</div>
          ) : (
            // Render providers and their models
            Object.entries(modelsByProvider).map(([providerId, { name, models }]) => {
              if (models.length === 0) return null;
              
              return (
                <div key={providerId}>
                  <DropdownMenuLabel>{name}</DropdownMenuLabel>
                  {models.map(model => (
                    <ModelMenuItem 
                      key={model.id}
                      chatModel={model}
                      isSelected={model.id === optimisticModelId}
                      onSelect={() => {
                        setOpen(false);
                        startTransition(() => {
                          setOptimisticModelId(model.id);
                          saveChatModelAsCookie(model.id);
                        });
                      }}
                    />
                  ))}
                  <DropdownMenuSeparator />
                </div>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Helper component for model menu items
function ModelMenuItem({ 
  chatModel, 
  isSelected, 
  onSelect 
}: { 
  chatModel: ChatModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      data-testid={`model-selector-item-${chatModel.id}`}
      onSelect={onSelect}
      data-active={isSelected}
      asChild
    >
      <button
        type="button"
        className="gap-4 group/item flex flex-row justify-between items-center w-full"
      >
        <div className="flex flex-col gap-1 items-start">
          <div>{chatModel.name}</div>
          <div className="text-xs text-muted-foreground">
            {chatModel.description}
          </div>
        </div>

        <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
          <CheckCircleFillIcon />
        </div>
      </button>
    </DropdownMenuItem>
  );
}
