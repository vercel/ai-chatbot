import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar user={session?.user}>
          {children}
        </AppSidebar>
      </div>
    </>
  );
}
