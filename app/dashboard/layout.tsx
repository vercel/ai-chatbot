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
import { auth } from "../(auth)/auth";
import { Skeleton } from "@/components/ui/skeleton";

async function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([
    auth(),
    cookies(),
  ]);
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
        <ChatSidebarWrapper user={session?.user} />
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

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
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

