import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth-service";
import type { User } from "@/lib/auth-service-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh" />}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Get sidebar state from cookies (handle prerendering gracefully)
  let isCollapsed = true; // Default to collapsed
  try {
    const cookieStore = await cookies();
    isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";
  } catch {
    // During prerendering, cookies() may fail - use default value
    // This is expected and handled gracefully
  }

  // If no user, we'll let the proxy middleware handle guest creation
  // The proxy will redirect to /api/auth/guest which sets cookies properly
  // For now, we'll just pass the user (or undefined) to the sidebar
  // The sidebar will show "Login to your account" for guest users
  const currentUser: User | null = user;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={currentUser ?? undefined} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
