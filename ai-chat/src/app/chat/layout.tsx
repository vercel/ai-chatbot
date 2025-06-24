import Script from 'next/script';
import { SidebarInset, SidebarProvider } from '@ai-chat/components/ui/sidebar';
import { AppSidebar } from '@ai-chat/components/app-sidebar';
import { getOAuthUserName } from '@ai-chat/auth/useAuthConfig';

export default function ChatLayout({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  const userName = getOAuthUserName();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={isCollapsed}>
        {/* <AppSidebar user={session.user} /> */}
        <AppSidebar user={userName} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
