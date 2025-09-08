'use client';

import { startTransition, useOptimistic, useState } from 'react';
import { saveAIProviderAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export type AIProvider = 'local' | 'vertex' | 'vercel';

interface ProviderOption {
  id: AIProvider;
  name: string;
  description: string;
  icon: string;
}

const providerOptions: ProviderOption[] = [
  {
    id: 'local',
    name: 'Ollama (Local)',
    description: 'Executa modelos localmente via Ollama',
    icon: '🏠',
  },
  {
    id: 'vertex',
    name: 'Vertex AI (Google Cloud)',
    description: 'Modelos Gemini via Google Cloud Platform',
    icon: '☁️',
  },
  {
    id: 'vercel',
    name: 'Vercel AI Gateway',
    description: 'Gateway unificado com múltiplos provedores',
    icon: '⚡',
  },
];

export function ProviderSelector({
  selectedProvider,
  onProviderChange,
  className,
}: {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticProvider, setOptimisticProvider] =
    useOptimistic(selectedProvider);

  const selectedProviderOption = providerOptions.find(
    (option) => option.id === optimisticProvider,
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
          data-testid="provider-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          <span className="mr-2">{selectedProviderOption?.icon}</span>
          {selectedProviderOption?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[350px]">
        {providerOptions.map((provider) => {
          const { id } = provider;

          return (
            <DropdownMenuItem
              data-testid={`provider-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticProvider(id);
                  saveAIProviderAsCookie(id);
                  onProviderChange(id);
                });
              }}
              data-active={id === optimisticProvider}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-row gap-3 items-center">
                  <span className="text-lg">{provider.icon}</span>
                  <div className="flex flex-col gap-1 items-start">
                    <div>{provider.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {provider.description}
                    </div>
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