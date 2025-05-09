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

// Dynamic imports to avoid TypeScript errors
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() =>
  import('./admin/admin-dashboard').then((mod) => ({
    default: mod.AdminDashboard,
  })),
);
const AdminUsers = dynamic(() =>
  import('./admin/admin-users').then((mod) => ({ default: mod.AdminUsers })),
);
const AdminProviders = dynamic(() =>
  import('./admin/admin-providers').then((mod) => ({
    default: mod.AdminProviders,
  })),
);
const AdminSettings = dynamic(() =>
  import('./admin/admin-settings').then((mod) => ({
    default: mod.AdminSettings,
  })),
);

interface AdminDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDialog({ user, isOpen, onClose }: AdminDialogProps) {
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
          <Tabs defaultValue="dashboard" className="w-full">
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
