'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/toast';
import { LoaderIcon } from 'lucide-react';

interface SystemSettings {
  id?: string;
  allowGuestUsers: boolean;
  allowRegistration: boolean;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    allowGuestUsers: true,
    allowRegistration: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/admin/api/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        type: 'error',
        description: 'Failed to load settings. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/admin/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        type: 'success',
        description: 'Settings saved successfully.',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        type: 'error',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleGuestAccess = (checked: boolean) => {
    setSettings({ ...settings, allowGuestUsers: checked });
    setHasChanges(true);
  };

  const handleToggleRegistration = (checked: boolean) => {
    setSettings({ ...settings, allowRegistration: checked });
    setHasChanges(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure global settings for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
              Loading settings...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="guest-access">Guest Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to access the application without logging in
                  </p>
                </div>
                <Switch
                  id="guest-access"
                  checked={settings.allowGuestUsers}
                  onCheckedChange={handleToggleGuestAccess}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register accounts
                  </p>
                </div>
                <Switch
                  id="registration"
                  checked={settings.allowRegistration}
                  onCheckedChange={handleToggleRegistration}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveSettings}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <>
                      <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
