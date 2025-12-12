import type React from "react"
import { cookies } from "next/headers"
import Script from "next/script"
import { AppSidebar } from "@/components/app-sidebar"
import { DataStreamProvider } from "@/components/data-stream-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true"

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js" strategy="beforeInteractive" />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={undefined} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  )
}
