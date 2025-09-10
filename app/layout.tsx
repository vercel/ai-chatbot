import { Toaster } from "sonner";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { AccessibilityProvider } from "@/lib/accessibility/context";
import { AccessibilityListener } from "@/components/accessibility-listener";
import { PersonaProvider } from "@/lib/persona/context";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";

import "./globals.css";
import "../styles/accessibility.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "Next.js Chatbot Template",
  description: "Next.js chatbot template using the AI SDK.",
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};


const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
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
      lang="pt-BR"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
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
          <TooltipProvider>
            <AccessibilityProvider>
              <PersonaProvider>
                <SessionProvider
                  basePath="/api/auth"
                  baseUrl="http://localhost:3000"
                >
                  <DataStreamProvider>
                    <header className="border-b">
                      <div className="container flex h-12 items-center">
                        <Link href="/" className="font-bold">
                          YSH
                        </Link>
                      </div>
                    </header>
                    <main className="container py-4">{children}</main>
                    <AccessibilityListener />
                  </DataStreamProvider>
                </SessionProvider>
              </PersonaProvider>
            </AccessibilityProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
