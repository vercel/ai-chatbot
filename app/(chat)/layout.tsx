import { cookies } from 'next/headers';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { auth } from '../(auth)/auth';
import Script from 'next/script';

// Use dynamic import to improve initial load time
const AppSidebar = dynamic(
  () => import('@/components/app-sidebar').then(mod => ({ default: mod.AppSidebar })),
  {
    ssr: true,
    loading: () => <div className="flex h-screen w-full overflow-hidden bg-background"><div className="w-80 border-r border-border h-full" /><div className="flex-1" /></div>
  }
);

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      {/* Load heavy scripts with proper strategy */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      
      {/* Wrap the sidebar with Suspense for better perceived performance */}
      <Suspense fallback={<div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="w-80 border-r border-border animate-pulse h-full" />
        <div className="flex-1" />
      </div>}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar user={session?.user}>
            {children}
          </AppSidebar>
        </div>
      </Suspense>
    </>
  );
}
