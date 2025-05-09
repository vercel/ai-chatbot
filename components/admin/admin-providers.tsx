'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { LoaderIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminModels } from './admin-models';

type Provider = {
  id: string;
  name: string;
  slug: string;
  apiKey: string | null;
  baseUrl: string | null;
  enabled: boolean;
};

export function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

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

  const updateProvider = async (id: string, updates: Partial<Provider>) => {
    try {
      const response = await fetch(`/admin/api/providers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update provider');
      }

      // Update local state
      setProviders(
        providers.map((provider) =>
          provider.id === id ? { ...provider, ...updates } : provider,
        ),
      );

      toast({
        type: 'success',
        description: 'Provider updated successfully.',
      });
    } catch (error) {
      console.error('Error updating provider:', error);
      toast({
        type: 'error',
        description: 'Failed to update provider. Please try again.',
      });
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateProvider(id, { enabled });
  };

  const handleApiKeyChange = (id: string, apiKey: string) => {
    updateProvider(id, { apiKey });
  };

  const handleBaseUrlChange = (id: string, baseUrl: string) => {
    updateProvider(id, { baseUrl });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">AI Providers</h3>
            <Button variant="outline" onClick={fetchProviders}>
              Refresh
            </Button>
          </div>

          {providers.length === 0 ? (
            <div className="bg-muted text-muted-foreground rounded-md p-8 text-center">
              No providers configured
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 mt-4">
              {providers.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor={`enable-${provider.id}`}
                          className="text-sm"
                        >
                          Enable
                        </Label>
                        <Switch
                          id={`enable-${provider.id}`}
                          checked={provider.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleEnabled(provider.id, checked)
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`apikey-${provider.id}`}>API Key</Label>
                      <Input
                        id={`apikey-${provider.id}`}
                        type="password"
                        value={provider.apiKey || ''}
                        onChange={(e) =>
                          handleApiKeyChange(provider.id, e.target.value)
                        }
                        placeholder="Enter API key"
                      />
                    </div>

                    {provider.baseUrl !== undefined && (
                      <div className="space-y-2">
                        <Label htmlFor={`baseurl-${provider.id}`}>
                          Base URL
                        </Label>
                        <Input
                          id={`baseurl-${provider.id}`}
                          value={provider.baseUrl || ''}
                          onChange={(e) =>
                            handleBaseUrlChange(provider.id, e.target.value)
                          }
                          placeholder="Enter base URL (optional)"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <AdminModels />
        </TabsContent>
      </Tabs>
    </div>
  );
}
