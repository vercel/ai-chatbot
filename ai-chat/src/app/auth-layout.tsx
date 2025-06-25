'use client';

import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from 'react-oidc-context';
import { Geist, Geist_Mono } from 'next/font/google';
import { useAuthConfig } from '@ai-chat/auth/use-auth-config';
import { ThemeProvider } from '@ai-chat/components/theme-provider';
import ChatLayout from './chat/layout';
import { useEffect } from 'react';
import { Api } from './api/api';
import i18next from '@ai-chat/i18n/config';

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

  useEffect(() => {
    Api.getUserSettings().then((data) => console.info(data));
  }, []);

  return (
    <I18nextProvider i18n={i18next} defaultNS={'translation'}>
      <AuthProvider {...authConfig}>
        <AuthWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <div className={`${geistSans.variable} ${geistMono.variable}`}>
              <ChatLayout isCollapsed={isCollapsed}>{children}</ChatLayout>
            </div>
          </ThemeProvider>
        </AuthWrapper>
      </AuthProvider>
    </I18nextProvider>
  );
}
