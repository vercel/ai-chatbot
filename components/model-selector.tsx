'use client';

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  useEffect,
} from 'react';

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
import {
  chatModels,
  type ChatModel,
  PROVIDERS,
  type Provider,
} from '@/lib/ai/client-models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

interface ProviderData {
  name: string;
  models: ChatModel[];
}

interface ModelsResponse {
  providers: Record<Provider | string, ProviderData>;
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
  const [providersData, setProvidersData] = useState<Record<
    string,
    ProviderData
  > | null>(null);

  // Function to fetch models from API
  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/models');

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data: ModelsResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setProvidersData(data.providers);
      console.log('Fetched models:', data.providers);
    } catch (err: any) {
      console.error('Failed to fetch models:', err);
      setError(err.message || 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchModels();
  }, []);

  // Listen for model updates from admin panel
  useEffect(() => {
    const handleModelUpdate = (event: Event) => {
      console.log('Model update detected, refreshing models list');
      fetchModels();
    };

    // Listen for the new models-updated event
    window.addEventListener('models-updated', handleModelUpdate);

    return () => {
      window.removeEventListener('models-updated', handleModelUpdate);
    };
  }, []);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // Use fetched models if available, otherwise fall back to static list
  const availableModels = useMemo(() => {
    if (providersData) {
      // Flatten all models from all providers
      const allModels = Object.values(providersData).flatMap(
        (provider) => provider.models,
      );

      console.log('Models from API:', allModels);
      console.log('Allowed model IDs:', availableChatModelIds);

      // More lenient filtering - if the model id partially matches an allowed id
      // This helps with format differences between provider-modelname and the entitlements
      return allModels.filter((model) => {
        // Check exact match first (e.g., 'openai-gpt4o')
        if (availableChatModelIds.includes(model.id)) {
          return true;
        }

        // Then check if the model.id starts with a generic provider pattern (e.g., 'anthropic-')
        return availableChatModelIds.some((allowedIdPattern) => {
          if (allowedIdPattern.endsWith('-')) {
            // This identifies a generic provider pattern
            return model.id.startsWith(allowedIdPattern);
          }
          return false; // Not a generic pattern, already handled by exact match
        });
      });
    } else {
      // Fall back to static list
      return chatModels.filter((model) =>
        availableChatModelIds.includes(model.id),
      );
    }
  }, [providersData, availableChatModelIds]);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    if (providersData) {
      const result: Record<string, { name: string; models: ChatModel[] }> = {};

      // Initialize with empty arrays for each provider
      Object.keys(providersData).forEach((providerId) => {
        result[providerId] = {
          name: providersData[providerId].name,
          models: [],
        };
      });

      // Populate with available models
      availableModels.forEach((model) => {
        if (result[model.provider]) {
          result[model.provider].models.push(model);
        }
      });

      return result;
    } else {
      // Fall back to static grouping
      const grouped: Record<string, { name: string; models: ChatModel[] }> = {
        [PROVIDERS.OPENAI]: { name: 'OpenAI', models: [] },
        [PROVIDERS.XAI]: { name: 'xAI', models: [] },
        [PROVIDERS.ANTHROPIC]: { name: 'Anthropic', models: [] },
        [PROVIDERS.GOOGLE]: { name: 'Google', models: [] },
        [PROVIDERS.MISTRAL]: { name: 'Mistral', models: [] },
        [PROVIDERS.GROQ]: { name: 'Groq', models: [] },
        [PROVIDERS.COHERE]: { name: 'Cohere', models: [] },
      };

      availableModels.forEach((model) => {
        grouped[model.provider].models.push(model);
      });

      return grouped;
    }
  }, [providersData, availableModels]);

  const selectedChatModel = useMemo(
    () => availableModels.find((model) => model.id === optimisticModelId),
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
            {isLoading
              ? 'Loading models...'
              : selectedChatModel?.name || 'Select model'}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          {error ? (
            <div className="p-2 text-sm text-red-500">
              Error loading models: {error}
            </div>
          ) : isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">
              Loading available models...
            </div>
          ) : Object.keys(modelsByProvider).length === 0 ||
            Object.values(modelsByProvider).every(
              (provider) => provider.models.length === 0,
            ) ? (
            <div className="p-2 text-sm text-muted-foreground">
              No models available. Please check admin settings.
            </div>
          ) : (
            // Render providers and their models
            Object.entries(modelsByProvider).map(
              ([providerId, { name, models }]) => {
                if (models.length === 0) return null;

                return (
                  <div key={providerId}>
                    <DropdownMenuLabel>{name}</DropdownMenuLabel>
                    {models.map((model) => (
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
              },
            )
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
  onSelect,
}: {
  chatModel: ChatModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  // Use the exact model ID for selection and comparison
  return (
    <DropdownMenuItem
      key={chatModel.id}
      onClick={onSelect}
      className="flex items-center gap-2 justify-between"
    >
      <span className="font-medium">{chatModel.name}</span>
      {isSelected ? (
        <CheckCircleFillIcon size={16} className="text-primary" />
      ) : null}
    </DropdownMenuItem>
  );
}
