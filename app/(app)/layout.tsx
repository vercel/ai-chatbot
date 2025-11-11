import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { DataStreamProvider } from "@/components/shared/data-stream-provider";
import { ChatSidebarWrapper } from "@/components/sidebar/chat-sidebar-wrapper";
import { SidebarWidthManager } from "@/components/sidebar/sidebar-width-manager";
import { ChatSidebarTrigger } from "@/components/sidebar/chat-sidebar-trigger";
import TopNav from "@/components/custom/topnav";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "next-auth";

async function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthenticatedUser();

  // If not authenticated, render children without sidebar (for marketing page)
  if (!authUser) {
    return <>{children}</>;
  }

  // Create a compatible user object for ChatSidebarWrapper
  // ChatSidebarWrapper expects a next-auth User type with id and email
  const user: User = {
    id: authUser.id,
    email: authUser.email ?? null,
    name: authUser.email?.split("@")[0] ?? null,
    type: "regular" as const,
  };

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider
      defaultOpen={!isCollapsed}
      style={
        {
          "--sidebar-width": "30rem",
        } as React.CSSProperties
      }
    >
      <SidebarWidthManager />
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-8 w-full" />
          </div>
        }
      >
        <ChatSidebarWrapper user={user} />
      </Suspense>
      <SidebarInset className="md:order-first">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex w-full items-center gap-2 px-4">
            <TopNav />
            <ChatSidebarTrigger />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

async function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthenticatedUser();

  // If not authenticated, render without dashboard-specific resources
  if (!authUser) {
    return <>{children}</>;
  }

  // For authenticated users, load dashboard resources
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="animate-spin">Loading...</div>
            </div>
          }
        >
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}

