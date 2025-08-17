'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { useProviders } from '@/hooks/use-providers';
import { useAvailableModels } from '@/hooks/use-available-models';
import type { Session } from 'next-auth';

const providerLogos = {
  openai: '🤖',
  anthropic: '🟡',
  google: '🔵',
};

const categoryLabels = {
  fast: 'Fast',
  balanced: 'Balanced',
  advanced: 'Advanced',
  reasoning: 'Reasoning',
};

const pricingTierColors = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  premium: 'text-red-600 dark:text-red-400',
};

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

  const { providers, loading: providersLoading } = useProviders();
  const { models: availableModels, loading: modelsLoading } = useAvailableModels();

  // Filter models by provider configuration
  const availableChatModels = availableModels.filter((chatModel) => {
    // Check if the provider is configured (only filter if not loading)
    const providerConfigured = providersLoading || providers[chatModel.provider];
    
    // Debug logging for model filtering
    if (process.env.NODE_ENV === 'development') {
      if (!providerConfigured) {
        console.log(`🚫 Filtering out ${chatModel.id} (${chatModel.provider}): providerConfigured=${providerConfigured}, loading=${providersLoading}`);
      }
    }
    
    return providerConfigured;
  });

  // Debug summary of available models
  if (process.env.NODE_ENV === 'development' && availableChatModels.length > 0) {
    console.log(`\n🎯 Model Selector Debug:`);
    console.log(`📊 Models from API: ${availableModels.length}`);
    console.log(`⏳ Providers loading: ${providersLoading}`);
    console.log(`🏭 Configured providers:`, Object.keys(providers).filter(p => (providers as any)[p]));
    console.log(`✅ Final available models: ${availableChatModels.length}`);
    console.log(`📝 Available model names: ${availableChatModels.map(m => m.name).join(', ')}`);
  }


  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped = availableChatModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, typeof availableChatModels>);

    // Sort models within each provider by category priority
    const categoryOrder = { fast: 0, balanced: 1, advanced: 2, reasoning: 3 };
    Object.keys(grouped).forEach(provider => {
      grouped[provider].sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);
    });

    return grouped;
  }, [availableChatModels]);

  const loading = modelsLoading || providersLoading;

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
          className="md:px-2 md:h-[34px] flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              {selectedChatModel && (
                <span className="text-sm">
                  {providerLogos[selectedChatModel.provider]}
                </span>
              )}
              {selectedChatModel?.name || 'Select Model'}
              <ChevronDownIcon />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[350px] max-h-[60vh] overflow-y-auto">
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
          <strong>Artifacts</strong> create code, documents & content in a side panel
        </div>
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="text-base">{providerLogos[provider as keyof typeof providerLogos]}</span>
              {provider}
            </DropdownMenuLabel>
            {models.map((chatModel) => {
              const { id } = chatModel;
              const isSelected = id === optimisticModelId;

              return (
                <DropdownMenuItem
                  data-testid={`model-selector-item-${id}`}
                  key={id}
                  onSelect={() => {
                    setOpen(false);

                    startTransition(() => {
                      setOptimisticModelId(id);
                      saveChatModelAsCookie(id);
                    });
                  }}
                  data-active={isSelected}
                  asChild
                >
                  <button
                    type="button"
                    className="gap-3 group/item flex flex-row justify-between items-center w-full py-3"
                  >
                    <div className="flex flex-col gap-1 items-start flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chatModel.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {categoryLabels[chatModel.category]}
                        </span>
                        {chatModel.capabilities.reasoning && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            Reasoning
                          </span>
                        )}
                        {chatModel.capabilities.thinking && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            Thinking
                          </span>
                        )}
                        {/* Show artifact availability based on chat API logic */}
                        {(() => {
                          // Match the exact logic from chat API
                          const isModernReasoningModel = chatModel.id.startsWith('o3') || chatModel.id.startsWith('o4-');
                          const isLegacyReasoningModel = chatModel.id === 'chat-model-reasoning';
                          const hasThinkingCapability = chatModel.capabilities.thinking === true;
                          const isReasoningModel = isLegacyReasoningModel || isModernReasoningModel || hasThinkingCapability;
                          
                          return !isReasoningModel && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">
                              Artifacts
                            </span>
                          );
                        })()}
                        {chatModel.capabilities.audio && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            Audio
                          </span>
                        )}
                        {chatModel.capabilities.realTime && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                            Real-time
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chatModel.description}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn("font-medium", pricingTierColors[chatModel.pricing.tier])}>
                          {chatModel.pricing.tier} cost
                        </span>
                        {chatModel.capabilities.vision && (
                          <span className="text-muted-foreground">Vision</span>
                        )}
                        {chatModel.capabilities.codeGeneration && (
                          <span className="text-muted-foreground">Code</span>
                        )}
                      </div>
                    </div>

                    <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      <CheckCircleFillIcon />
                    </div>
                  </button>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
