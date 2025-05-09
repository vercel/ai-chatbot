'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { LoaderIcon, PlusIcon, AlertCircleIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type ProviderModel = {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  isChat: boolean;
  isImage: boolean;
  enabled: boolean;
  config: any;
};

type Provider = {
  id: string;
  name: string;
  slug: string;
};

type AvailableModel = {
  id: string;
  name: string;
  type: string;
  existingModelId?: string;
  enabled?: boolean;
  uniqueId?: string; // To handle duplicate model IDs
};

export function AdminModels() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [allModels, setAllModels] = useState<AvailableModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0].id);
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    if (selectedProvider) {
      refreshAvailableModels();
    }
  }, [selectedProvider]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/admin/api/providers');

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        type: 'error',
        description: 'Failed to load providers. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableModels = async (providerId: string) => {
    const currentProvider = providers.find((p) => p.id === providerId);
    if (!currentProvider) {
      return;
    }

    try {
      setApiKeyError(null);
      const response = await fetch(
        `/admin/api/providers/${providerId}/available-models`,
      );
      const data = await response.json();

      // Always continue to display models even with errors
      if (data.error) {
        console.error('Error fetching available models:', data.error);
        setApiKeyError(data.error);
      }

      // Even with errors, we should still have models from the database
      if (data.models?.length > 0) {
        // Add a unique ID to each model for React key
        const modelsWithUniqueIds = data.models.map(
          (model: AvailableModel, index: number) => ({
            ...model,
            uniqueId: `model-${model.id}-${index}`,
          }),
        );

        setAllModels(modelsWithUniqueIds);
      } else {
        setAllModels([]);
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
      toast({
        type: 'error',
        description: 'Connection error while fetching models.',
      });

      // Set an error message but don't block UI
      setApiKeyError(
        'Connection error while fetching models. Please check network and try again.',
      );
    }
  };

  const toggleModelEnabled = async (model: AvailableModel) => {
    try {
      // All models should now have existingModelId since they're in the database
      if (model.existingModelId) {
        const response = await fetch(
          `/admin/api/providers/models/${model.existingModelId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enabled: !model.enabled,
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to update model');
        }
      } else {
        console.error('Model is missing existingModelId', model);
        throw new Error('Cannot update model: Missing ID');
      }

      // Update local state
      setAllModels((prev) =>
        prev.map((m) =>
          m.uniqueId === model.uniqueId ? { ...m, enabled: !m.enabled } : m,
        ),
      );

      // Dispatch a custom event to notify other components that models have changed
      const event = new CustomEvent('models-updated', {
        detail: { providerId: selectedProvider },
      });
      window.dispatchEvent(event);

      toast({
        type: 'success',
        description: `${model.name} has been ${
          model.enabled ? 'disabled' : 'enabled'
        }.`,
      });
    } catch (error) {
      console.error('Error toggling model enabled:', error);
      toast({
        type: 'error',
        description: 'Failed to update model. Please try again.',
      });
    }
  };

  const refreshAvailableModels = () => {
    if (selectedProvider) {
      setIsLoadingModels(true);
      setApiKeyError(null);
      fetchAvailableModels(selectedProvider).finally(() => {
        setIsLoadingModels(false);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">AI Models</h3>
        <div className="flex space-x-2">
          <select
            className="px-3 py-2 rounded-md border"
            value={selectedProvider || ''}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          {selectedProvider && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAvailableModels}
              disabled={isLoadingModels}
            >
              {isLoadingModels ? (
                <LoaderIcon className="h-4 w-4 mr-1" />
              ) : (
                'Refresh Models'
              )}
            </Button>
          )}
        </div>
      </div>

      {apiKeyError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircleIcon className="h-5 w-5 mr-2" />
          <div>
            <p>{apiKeyError}</p>
            <p className="text-sm">
              {apiKeyError.includes('API key')
                ? 'This is normal for providers that use predefined model lists. You can still enable the default models or configure an API key in the Providers tab.'
                : 'You can still enable/disable existing models.'}
            </p>
          </div>
        </div>
      )}

      {isLoadingModels ? (
        <div className="flex items-center justify-center h-64">
          <LoaderIcon className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading models...</span>
        </div>
      ) : allModels.length === 0 ? (
        <div className="bg-muted text-muted-foreground rounded-md p-8 text-center">
          <div className="mb-4">
            {apiKeyError ? (
              <p>No models available due to error: {apiKeyError}</p>
            ) : (
              <p>No models available for {currentProvider?.name}</p>
            )}
          </div>
          <p className="text-sm">
            {apiKeyError?.includes('API key')
              ? 'Please configure API keys in the Providers tab and try again.'
              : 'Try refreshing the models list or check the provider configuration.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {allModels.map((model) => (
            <Card key={model.uniqueId || `${model.id}-${Math.random()}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor={`enable-${model.uniqueId}`}
                      className="text-sm"
                    >
                      Enable
                    </Label>
                    <Switch
                      id={`enable-${model.uniqueId}`}
                      checked={!!model.enabled}
                      onCheckedChange={() => toggleModelEnabled(model)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Model ID: </span>
                  {model.id}
                </div>
                <div className="flex space-x-4 text-sm">
                  <span>
                    <span className="font-medium">Type: </span>
                    {model.type === 'chat'
                      ? 'Chat'
                      : model.type === 'image'
                        ? 'Image'
                        : 'Other'}
                  </span>
                  <span>
                    <span className="font-medium">Status: </span>
                    {model.existingModelId ? 'Configured' : 'Available'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
