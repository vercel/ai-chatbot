import { requireAdmin } from '@/lib/rbac/middleware';
import { Sidebar } from './components/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if the user is not an admin
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
