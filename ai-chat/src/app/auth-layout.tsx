'use client';

import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';
import { AuthProvider } from 'react-oidc-context';
import { Geist, Geist_Mono } from 'next/font/google';
import { useAuthConfig } from '@ai-chat/auth/useAuthConfig';
import { ThemeProvider } from '@ai-chat/components/theme-provider';
import ChatLayout from './chat/layout';

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
    () => import('../components/auth-wrapper/AuthWrapper'),
    {
      ssr: false,
    },
  );

  return (
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
  );
}
