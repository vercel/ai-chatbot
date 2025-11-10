import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DataStreamProvider } from "@/components/shared/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

async function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default function Layout({
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
            <SidebarProvider defaultOpen={true}>
              <AppSidebar user={undefined} />
              <SidebarInset>
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin">Loading...</div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          }
        >
          <SidebarWrapper>
            <Suspense fallback={<div className="p-4">Loading page...</div>}>
              {children}
            </Suspense>
          </SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}
