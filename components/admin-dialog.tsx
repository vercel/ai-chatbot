'use client';

import type { User } from 'next-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { LoaderIcon } from 'lucide-react';

// Import admin components directly instead of using dynamic imports
// This avoids chunk loading errors
import { AdminDashboard } from './admin/admin-dashboard';
import { AdminUsers } from './admin/admin-users';
import { AdminProviders } from './admin/admin-providers';
import { AdminSettings } from './admin/admin-settings';

interface AdminDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDialog({ user, isOpen, onClose }: AdminDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <DialogTitle>Admin Dashboard</DialogTitle>
            <Badge>Admin Only</Badge>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="providers" className="mt-6">
              <AdminProviders />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <AdminSettings />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
