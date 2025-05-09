'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { LoaderIcon, PlusIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

export function AdminModels() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modelsByProvider, setModelsByProvider] = useState<
    Record<string, ProviderModel[]>
  >({});
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    modelId: '',
    isChat: true,
    isImage: false,
  });

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
      fetchModels(selectedProvider);
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

  const fetchModels = async (providerId: string) => {
    try {
      const response = await fetch(`/admin/api/providers/${providerId}/models`);

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      setModelsByProvider((prev) => ({
        ...prev,
        [providerId]: data,
      }));
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        type: 'error',
        description: 'Failed to load models. Please try again.',
      });
    }
  };

  const handleToggleEnabled = async (modelId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/admin/api/providers/models/${modelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update model');
      }

      // Update local state
      if (selectedProvider) {
        setModelsByProvider((prev) => ({
          ...prev,
          [selectedProvider]: prev[selectedProvider].map((model) =>
            model.id === modelId ? { ...model, enabled } : model,
          ),
        }));
      }

      toast({
        type: 'success',
        description: 'Model updated successfully.',
      });
    } catch (error) {
      console.error('Error updating model:', error);
      toast({
        type: 'error',
        description: 'Failed to update model. Please try again.',
      });
    }
  };

  const handleCreateModel = async () => {
    if (!selectedProvider) return;

    try {
      const response = await fetch(
        `/admin/api/providers/${selectedProvider}/models`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newModel),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create model');
      }

      const createdModel = await response.json();

      // Update local state
      setModelsByProvider((prev) => ({
        ...prev,
        [selectedProvider]: [...(prev[selectedProvider] || []), createdModel],
      }));

      // Reset form and close dialog
      setNewModel({
        name: '',
        modelId: '',
        isChat: true,
        isImage: false,
      });
      setIsDialogOpen(false);

      toast({
        type: 'success',
        description: 'Model created successfully.',
      });
    } catch (error) {
      console.error('Error creating model:', error);
      toast({
        type: 'error',
        description: 'Failed to create model. Please try again.',
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

  const currentModels = selectedProvider
    ? modelsByProvider[selectedProvider] || []
    : [];
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
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {currentModels.length === 0 ? (
        <div className="bg-muted text-muted-foreground rounded-md p-8 text-center">
          No models configured for {currentProvider?.name}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {currentModels.map((model) => (
            <Card key={model.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`enable-${model.id}`} className="text-sm">
                      Enable
                    </Label>
                    <Switch
                      id={`enable-${model.id}`}
                      checked={model.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleEnabled(model.id, checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Model ID: </span>
                  {model.modelId}
                </div>
                <div className="flex space-x-4 text-sm">
                  <span>
                    <span className="font-medium">Chat: </span>
                    {model.isChat ? 'Yes' : 'No'}
                  </span>
                  <span>
                    <span className="font-medium">Image: </span>
                    {model.isImage ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Model Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input
                id="model-name"
                value={newModel.name}
                onChange={(e) =>
                  setNewModel({ ...newModel, name: e.target.value })
                }
                placeholder="e.g., GPT-4o"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-id">Model ID</Label>
              <Input
                id="model-id"
                value={newModel.modelId}
                onChange={(e) =>
                  setNewModel({ ...newModel, modelId: e.target.value })
                }
                placeholder="e.g., gpt-4o"
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-chat"
                  checked={newModel.isChat}
                  onCheckedChange={(checked) =>
                    setNewModel({ ...newModel, isChat: checked })
                  }
                />
                <Label htmlFor="is-chat">Chat Model</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-image"
                  checked={newModel.isImage}
                  onCheckedChange={(checked) =>
                    setNewModel({ ...newModel, isImage: checked })
                  }
                />
                <Label htmlFor="is-image">Image Model</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModel}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
