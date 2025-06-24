import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://coco.inwesol.com'),
  title: 'CoCo - Career Coach',
  description: 'AI Career Coach from Inwesol.',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <meta name="theme-color" content={LIGHT_THEME_COLOR} />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}