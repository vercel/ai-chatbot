import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Suspense } from 'react';

import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'WIZZO',
  description: 'WIZZO - AI Assistant',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(150deg 30% 10%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  'use strict';
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
  
  // Add preconnect for faster resource loading
  var links = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
  ];
  
  links.forEach(function(linkData) {
    var link = document.createElement('link');
    Object.keys(linkData).forEach(function(key) {
      link.setAttribute(key, linkData[key]);
    });
    document.head.appendChild(link);
  });
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
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased h-full overflow-hidden" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Use Suspense for non-critical UI elements */}
          <Suspense fallback={null}>
            <Toaster position="top-center" />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
