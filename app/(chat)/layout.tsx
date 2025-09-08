import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { AccessibilityButton } from '@/components/accessibility-button';
import { SkipLink } from '@/components/skip-link';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SkipLink mainId="main-content" />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <div className="absolute top-4 right-4 z-10">
            <AccessibilityButton />
          </div>
          <main id="main-content" className="outline-none" tabIndex={-1}>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
