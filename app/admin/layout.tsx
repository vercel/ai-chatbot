import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!['compliance_officer', 'admin'].includes(session.user.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="mr-4">
            <h1 className="text-lg font-semibold">Checky Admin</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <a href="/admin" className="text-foreground/60 hover:text-foreground">
              Dashboard
            </a>
            <a href="/admin/reports" className="text-foreground/60 hover:text-foreground">
              Reports
            </a>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email} ({session.user.role.replace('_', ' ')})
            </span>
            <a
              href="/"
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              Back to App
            </a>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}