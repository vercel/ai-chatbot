'use client';

import { Toaster } from 'sonner';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from 'react-oidc-context';
import { Geist, Geist_Mono } from 'next/font/google';
import i18next from '@ai-chat/i18n/config';
import { AppSidebar } from '@ai-chat/components/app-sidebar';
import { useAuthConfig } from '@ai-chat/auth/use-auth-config';
import { ThemeProvider } from '@ai-chat/components/theme-provider';
import { SidebarInset, SidebarProvider } from '@ai-chat/components/ui/sidebar';
import { CoreProvider } from './core-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  display: 'swap',
  subsets: ['latin'],
});

export default function AuthLayout({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  const authConfig = useAuthConfig();
  const AuthWrapper = dynamic(
    () => import('../components/auth-wrapper/auth-wrapper'),
    {
      ssr: false,
    },
  );

  return (
    <I18nextProvider i18n={i18next} defaultNS={'translation'}>
      <AuthProvider {...authConfig}>
        <AuthWrapper>
          <CoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-center" />
              <div className={`${geistSans.variable} ${geistMono.variable}`}>
                <Script
                  src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
                  strategy="beforeInteractive"
                />
                <SidebarProvider defaultOpen={isCollapsed}>
                  <AppSidebar />
                  <SidebarInset>{children}</SidebarInset>
                </SidebarProvider>
              </div>
            </ThemeProvider>
          </CoreProvider>
        </AuthWrapper>
      </AuthProvider>
    </I18nextProvider>
  );
}
