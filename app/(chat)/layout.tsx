'use client';

import React, { Children, useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';
import { ShareDialogProvider } from '@/components/share-dialog-context';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get sidebar state from localStorage
    const sidebarState = localStorage.getItem('sidebar:state');
    setIsCollapsed(sidebarState !== 'true');

    // Get user info from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to decode the JWT token here to get user info
      // For now, we'll just set a basic user object
      setUser({ email: 'user@example.com' });
    }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <ShareDialogProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </ShareDialogProvider>
    </>
  );
}
