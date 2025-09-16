import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "geist/font";

import { ThemeProvider } from "@/components/theme-provider";
import { AccessibilityProvider } from "@/lib/accessibility/context";
import { PersonaProvider } from "@/lib/persona/context";
import { AccessibilityListener } from "@/components/accessibility-listener";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import "./globals.css";
import "../styles/accessibility.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "Next.js Chatbot Template",
  description: "Next.js chatbot template using the AI SDK.",
};

export const viewport: Viewport = {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${Geist.className} ${Geist_Mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className="antialiased">
        {/* ThemeProvider custom — SEM props do next-themes */}
        <ThemeProvider>
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
