'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';

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
      try {
        // Manual JWT decode (no dependency)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        const decoded = JSON.parse(jsonPayload);
        console.log('Decoded JWT:', decoded); // Debug: check payload
        setUser({ email: decoded.email });
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
