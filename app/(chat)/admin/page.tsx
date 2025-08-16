import { auth } from '@/app/(auth)/auth';
import { isUserAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { InvitationDialog } from '@/components/invitation-dialog';
import { InvitationsList } from '@/components/invitations-list';
import { ModelManagement } from '@/components/model-management';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const isAdmin = await isUserAdmin(session.user.id);

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage invitations and users</p>
        </div>
        <InvitationDialog />
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Invitations</h2>
          <InvitationsList />
        </div>

        <div>
          <ModelManagement />
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Quick Setup Guide:</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Run the database migration: <code className="bg-background px-1 rounded">npx drizzle-kit push</code></li>
          <li>Make yourself an admin by updating your user record in the database</li>
          <li>Send invitations to new users from this page</li>
          <li>Users will receive a registration link to create their account</li>
        </ol>
      </div>
    </div>
  );
}