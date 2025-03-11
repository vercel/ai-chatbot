import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { setupCronJobs, ensureUserHasSystemChat } from '@/lib/cron';
import { SystemNotificationPoller } from '@/components/system-notification-poller';

export const experimental_ppr = true;

// Initialize cron job once at server startup
let cronInitialized = false;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Setup cron jobs at app initialization, but only once
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  if (session?.user?.id) {
    // Ensure this user has access to the research agent chat
    await ensureUserHasSystemChat(session.user.id);
    
    // Setup cron jobs if not already initialized
    if (!cronInitialized) {
      await setupCronJobs(session.user.id);
      cronInitialized = true;
    }
  }
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      {session?.user?.id && <SystemNotificationPoller />}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}