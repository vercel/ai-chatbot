'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChatModel } from '@/lib/ai/models';
import type { ModelSettings } from '@/lib/db/schema';

interface ModelWithSettings extends ChatModel {
  settings: Partial<ModelSettings>;
}

const tierColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  premium: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const providerLogos = {
  openai: '🤖',
  anthropic: '🟡',
  google: '🔵',
};

export function ModelManagement() {
  const [models, setModels] = useState<ModelWithSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState<any>({});

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models');
      const data = await response.json();
      
      if (response.ok) {
        setModels(data.models);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load models',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const updateModelSettings = async (modelId: string, settings: any) => {
    try {
      const response = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, ...settings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      toast({
        type: 'success',
        description: 'Model settings updated',
      });
      
      fetchModels();
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Failed to update model',
      });
    }
  };

  const toggleEnabled = async (modelId: string, isEnabled: boolean) => {
    await updateModelSettings(modelId, { isEnabled });
  };

  const startEditing = (model: ModelWithSettings) => {
    setEditingModel(model.id);
    setTempSettings({
      customName: model.settings.customName || '',
      customDescription: model.settings.customDescription || '',
      maxTier: model.settings.maxTier || model.pricing.tier,
      isHidden: model.settings.isHidden || false,
    });
  };

  const saveEditing = async () => {
    if (!editingModel) return;
    
    await updateModelSettings(editingModel, tempSettings);
    setEditingModel(null);
    setTempSettings({});
  };

  const cancelEditing = () => {
    setEditingModel(null);
    setTempSettings({});
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading models...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model Management</h3>
          <p className="text-sm text-muted-foreground">
            Control which models are available to users
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {models.filter(m => m.settings.isEnabled !== false).length} of {models.length} enabled
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Custom Settings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {editingModel === model.id ? (
                        <Input
                          value={tempSettings.customName}
                          onChange={(e) => setTempSettings((prev: any) => ({ ...prev, customName: e.target.value }))}
                          placeholder={model.name}
                          className="h-8"
                        />
                      ) : (
                        model.settings.customName || model.name
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {editingModel === model.id ? (
                        <Input
                          value={tempSettings.customDescription}
                          onChange={(e) => setTempSettings((prev: any) => ({ ...prev, customDescription: e.target.value }))}
                          placeholder={model.description}
                          className="h-6 text-xs"
                        />
                      ) : (
                        model.settings.customDescription || model.description
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {model.id}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{providerLogos[model.provider]}</span>
                    <span className="capitalize">{model.provider}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {editingModel === model.id ? (
                    <Select
                      value={tempSettings.maxTier}
                      onValueChange={(value) => setTempSettings((prev: any) => ({ ...prev, maxTier: value }))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={tierColors[model.settings.maxTier || model.pricing.tier]}>
                      {(model.settings.maxTier || model.pricing.tier).charAt(0).toUpperCase() + 
                       (model.settings.maxTier || model.pricing.tier).slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={model.settings.isEnabled !== false}
                      onCheckedChange={(checked) => toggleEnabled(model.id, checked)}
                    />
                    <span className="text-sm">
                      {model.settings.isEnabled !== false ? 'Enabled' : 'Disabled'}
                    </span>
                    {model.settings.isHidden && (
                      <Badge variant="secondary" className="ml-2">Hidden</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {editingModel === model.id ? (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Hidden:</Label>
                      <Switch
                        checked={tempSettings.isHidden}
                        onCheckedChange={(checked) => setTempSettings((prev: any) => ({ ...prev, isHidden: checked }))}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {model.settings.customName || model.settings.customDescription || model.settings.maxTier ? (
                        'Customized'
                      ) : (
                        'Default'
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingModel === model.id ? (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={saveEditing}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(model)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Disabled models won&apos;t appear in the model selector for any users</li>
          <li>Hidden models are available but not prominently displayed</li>
          <li>Custom names and descriptions override the defaults</li>
          <li>Max tier restricts which user types can access the model</li>
        </ul>
      </div>
    </div>
  );
}