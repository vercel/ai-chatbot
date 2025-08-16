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
import { allModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { useProviders } from '@/hooks/use-providers';
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

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];
  const { providers, loading } = useProviders();

  // Debug session and user type
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n👤 Session Debug:`);
    console.log(`🏷️ User type: ${userType}`);
    console.log(`👨‍💼 Session user:`, { id: session.user.id, email: session.user.email, type: session.user.type });
    console.log(`🎫 Available model IDs for ${userType}:`, availableChatModelIds.slice(0, 10).join(', '));
  }

  const availableChatModels = allModels.filter((chatModel) => {
    // Check if user has access to this model
    const hasAccess = availableChatModelIds.includes(chatModel.id);
    
    // Check if the provider is configured (only filter if not loading)
    const providerConfigured = loading || providers[chatModel.provider];
    
    const included = hasAccess && providerConfigured;
    
    // Debug logging for model filtering
    if (process.env.NODE_ENV === 'development') {
      if (!included) {
        console.log(`🚫 Filtering out ${chatModel.id} (${chatModel.provider}): hasAccess=${hasAccess}, providerConfigured=${providerConfigured}, loading=${loading}`);
      }
    }
    
    return included;
  });

  // Debug summary of available models
  if (process.env.NODE_ENV === 'development' && availableChatModels.length > 0) {
    console.log(`\n🎯 Model Selector Debug for user type: ${userType}`);
    console.log(`📊 Total models defined: ${allModels.length}`);
    console.log(`🎫 Models user has access to: ${availableChatModelIds.length}`);
    console.log(`⏳ Providers loading: ${loading}`);
    console.log(`🏭 Configured providers:`, Object.keys(providers).filter(p => providers[p]));
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
        >
          {selectedChatModel && (
            <span className="text-sm">
              {providerLogos[selectedChatModel.provider]}
            </span>
          )}
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[350px] max-h-[60vh] overflow-y-auto">
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
