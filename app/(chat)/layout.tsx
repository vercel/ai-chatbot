import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            background: rgba(16, 185, 129, 0.03) !important;
            background-attachment: fixed !important;
            min-height: 100vh !important;
          }
          * {
            box-sizing: border-box;
          }
          [data-sidebar-provider],
          [data-sidebar-provider] > *,
          [data-sidebar-inset],
          [data-sidebar-inset] > *,
          .bg-background,
          .bg-white,
          .bg-gray-50,
          .bg-slate-50 {
            background: transparent !important;
          }
        `
      }} />
      <div 
        className="min-h-screen"
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          backgroundAttachment: 'fixed',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed} className="relative z-10">
        <AppSidebar user={session?.user} />
        <SidebarInset className="!bg-transparent">{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}