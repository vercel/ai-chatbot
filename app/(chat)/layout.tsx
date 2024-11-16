import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

import { auth } from '../(auth)/auth';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SidebarDataWrapper } from './sidebar-data-wrapper';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  if (!session?.user) {
    return notFound();
  }

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user}>
        <Suspense fallback={<SidebarLoading />}>
          <SidebarDataWrapper user={session?.user} />
        </Suspense>
      </AppSidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

function SidebarLoading() {
  return (
    <SidebarGroup>
      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Today</div>
      <SidebarGroupContent>
        <div className="flex flex-col">
          {[44, 32, 28, 64, 52].map((item) => (
            <div
              key={item}
              className="rounded-md h-8 flex gap-2 px-2 items-center"
            >
              <div
                className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                style={
                  {
                    '--skeleton-width': `${item}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
