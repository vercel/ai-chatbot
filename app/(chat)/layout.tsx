import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { NetworkErrorFallback } from '@/components/error-fallbacks';

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
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <ErrorBoundary
        level="page"
        maxRetries={2}
        resetKeys={[session?.user?.id || '']}
      >
        <DataStreamProvider>
          <ErrorBoundary
            level="component"
            maxRetries={3}
            fallback={({ resetError, retryCount, maxRetries }) => (
              <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                  <p className="mb-4">Sidebar failed to load</p>
                  {retryCount < maxRetries && (
                    <button 
                      onClick={resetError}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded"
                    >
                      Retry Sidebar
                    </button>
                  )}
                </div>
              </div>
            )}
          >
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset>
                <ErrorBoundary
                  level="page"
                  maxRetries={3}
                  resetOnPropsChange={true}
                >
                  {children}
                </ErrorBoundary>
              </SidebarInset>
            </SidebarProvider>
          </ErrorBoundary>
        </DataStreamProvider>
      </ErrorBoundary>
    </>
  );
}
