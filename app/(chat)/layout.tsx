import { headers } from "next/headers";
import Script from "next/script";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { GatewayProvider } from "@/providers/gateway";

type ChatLayoutProps = {
  children: ReactNode;
};

const ChatLayout = async ({ children }: ChatLayoutProps) => {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <GatewayProvider>
          <SidebarProvider>
            <AppSidebar user={session?.user} />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </GatewayProvider>
      </DataStreamProvider>
    </>
  );
};

export default ChatLayout;
