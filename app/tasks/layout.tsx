import { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { getSession } from '@/lib/auth';

interface TasksLayoutProps {
  children: ReactNode;
}

export default async function TasksLayout({ children }: TasksLayoutProps) {
  const session = await getSession();

  return (
    <div className="h-screen flex bg-hunter_green-500">
      <AppSidebar user={session?.user} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}