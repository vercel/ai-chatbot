import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-chatbot-demo.vercel.app'),
  title: 'AI Chat | Neural-Powered AI Assistant',
  description: 'Experience the future of AI conversation with advanced language models including Gemini 2.5 Pro and Grok',
  keywords: ['AI', 'chatbot', 'Gemini', 'Grok', 'neural network', 'conversation'],
  openGraph: {
    title: 'AI Chat',
    description: 'Neural-powered AI assistant with advanced models',
    url: 'https://ai-chatbot-demo.vercel.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Chat - Neural Network Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  authors: [{ name: 'AI Chat Team' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
  themeColor: '#4F46E5',
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

const LIGHT_THEME_COLOR = '#4F46E5'; // Primary Blue
const DARK_THEME_COLOR = '#2563EB'; // Darker Blue for dark mode
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}