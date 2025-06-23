import { cookies } from 'next/headers';
import Script from 'next/script';
import { SidebarInset, SidebarProvider } from '@ai-chat/components/ui/sidebar';
import { AppSidebar } from '@ai-chat/components/app-sidebar';
import type { Session } from '@ai-chat/lib/types';
import { generateUUID } from '@ai-chat/lib/utils';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tempSession: Session = {
    expires: '2100-10-05T14:48:00.000Z',
    user: { email: 'fsilva@icrc.org', id: generateUUID(), type: 'regular' },
  };
  const [session, cookieStore] = await Promise.all([tempSession, cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={true}>
        <AppSidebar user={session.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
