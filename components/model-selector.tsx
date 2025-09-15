'use client';

import * as React from 'react';
import useSWR from 'swr';
import { usePathname, useRouter } from 'next/navigation';
import { type ChatModel, getStaticModels } from '@/lib/ai/models';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from './icons';

interface ModelSelectorProps extends React.ComponentProps<'div'> {
  initialModel: string;
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch models.');
  const json = await res.json();
  if (!('models' in json) || !Array.isArray(json.models)) throw new Error('Invalid models response.');
  // Data validation: Only keep valid models
  return (json.models as unknown[]).filter(
    (m): m is ChatModel =>
      m && typeof m === 'object' && typeof (m as any).id === 'string' && typeof (m as any).name === 'string'
  );
}

export function ModelSelector({ initialModel, ...props }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = React.useState(initialModel);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Fetch models via SWR, fallback to static if fetch fails
  const {
    data: dynamicModels = getStaticModels(),
    error,
    isLoading,
    mutate,
  } = useSWR<ChatModel[]>('/api/models', fetcher, {
    fallbackData: getStaticModels(),
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  // Defensive: Always have an array as models
  const models = Array.isArray(dynamicModels) ? dynamicModels : [];
  const activeModel = models.find((model) => model.id === selectedModel);

  const handleModelChange = async (modelId: string) => {
    const previous = selectedModel;
    setSelectedModel(modelId);
    setSaving(true);
    setSaveError(null);
    try {
      const resp = await fetch('/api/chat/save-model', {
        method: 'POST',
        body: JSON.stringify({ model: modelId }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) throw new Error('Failed to save model selection.');
      // Optionally, server responds with confirmation. Could check here.
      if (pathname === '/') {
        router.refresh();
      }
    } catch (err) {
      setSelectedModel(previous); // Revert on error
      setSaveError('Could not save model. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // --- UI States --- //
  if (error) {
    // Network/error state for fetching models
    return (
      <div {...props}>
        <div className="text-red-600 mb-2 flex items-center">
          Failed to load models.&nbsp;
          <button
            onClick={() => mutate()}
            className="underline text-blue-700"
            disabled={isLoading}
          >
            Retry
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled>Model selection unavailable</Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div {...props}>
      {isLoading && (
        <div className="text-sm text-neutral-500 mb-2">Loading available models…</div>
      )}
      {saveError && (
        <div className="text-red-600 mb-2">{saveError}</div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="flex items-center"
            aria-label="Select model"
            disabled={isLoading || saving}
            variant="outline"
          >
            <span>{activeModel ? activeModel.name : 'Select model'}</span>
            <ChevronDownIcon className="ml-2 w-4 h-4" />
            {saving && (
              <svg className="animate-spin ml-2 h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Select a model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={saving}
          >
            {models.length === 0 ? (
              <DropdownMenuRadioItem value="" disabled>
                No models found
              </DropdownMenuRadioItem>
            ) : (
              models.map((model) => (
                <DropdownMenuRadioItem key={model.id} value={model.id}>
                  <strong>{model.name}</strong>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </DropdownMenuRadioItem>
              ))
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <div className="text-xs text-yellow-600 mt-2">
          Showing static fallback models due to loading error.
        </div>
      )}
    </div>
  );
}
