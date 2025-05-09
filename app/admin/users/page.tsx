import { Suspense } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import UserTable from './components/user-table';
import { AddUserButton } from './components/add-user-button';

function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and roles.
          </p>
        </div>
        <AddUserButton />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="regular">Regular Users</TabsTrigger>
          <TabsTrigger value="guest">Guest Users</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage all users registered in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<UsersTableSkeleton />}>
                <UserTable filter="all" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admins" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                View and manage administrators with elevated permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<UsersTableSkeleton />}>
                <UserTable filter="admin" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="regular" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Users</CardTitle>
              <CardDescription>
                View and manage regular registered users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<UsersTableSkeleton />}>
                <UserTable filter="user" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="guest" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Users</CardTitle>
              <CardDescription>
                View and manage temporary guest accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<UsersTableSkeleton />}>
                <UserTable filter="guest" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
