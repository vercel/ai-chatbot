import { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { getSession } from '@/lib/auth';

interface TaskManagementLayoutProps {
  children: ReactNode;
}

export default async function TaskManagementLayout({ children }: TaskManagementLayoutProps) {
  const session = await getSession();

  return (
    <div className="h-screen flex">
      <AppSidebar user={session?.user} />
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}