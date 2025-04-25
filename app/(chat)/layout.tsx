import { cookies } from 'next/headers';
// Remove Supabase server client import if only used for auth
// import { createClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';
import { auth, currentUser } from '@clerk/nextjs/server'; // Import Clerk helpers
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // Await cookies()
  // Remove Supabase client creation and auth call
  // const supabase = await createClient();
  // const {
  //   data: { user: supabaseUser },
  // } = await supabase.auth.getUser();

  // Get Clerk user data
  const user = await currentUser(); // Get full Clerk user object
  const { userId } = await auth(); // Await auth() to get userId

  // Redirect or handle if not signed in (middleware should mostly handle this, but belt-and-suspenders)
  if (!userId && !user) {
    // Potentially redirect using redirect() from 'next/navigation' or return null/alternative layout
    // For now, let middleware handle redirect, but AppSidebar will receive undefined
    console.log('Chat layout: No Clerk user found.');
  }

  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        {/* <AppSidebar user={(user as any) ?? undefined} /> */}
        {/* AppSidebar now gets user context internally via hooks */}
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
