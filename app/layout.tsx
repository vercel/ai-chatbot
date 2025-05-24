
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Manrope, Fira_Code } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import {
  ClerkProvider,
  SignedIn,
  UserButton,
} from '@clerk/nextjs';
import { OnboardingTrigger } from '@/components/onboarding-trigger';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai.chrisyork.co'),
  title: 'SuperChat',
  description: '',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

const fira_code = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
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
    <ClerkProvider>
      <html
        lang="en"
        // `next-themes` injects an extra classname to the body element to avoid
        // visual flicker before hydration. Hence the `suppressHydrationWarning`
        // prop is necessary to avoid the React hydration mismatch warning.
        // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
        suppressHydrationWarning
        className={`${manrope.variable} ${fira_code.variable}`}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: THEME_COLOR_SCRIPT,
            }}
          />
        </head>
        <body className="antialiased" suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="absolute top-4 right-4">
              <SignedIn>
                <UserButton
                  userProfileProps={{
                    additionalOAuthScopes: {
                      // NOTE: drive.readonly is a restricted scope and requires Google verification for production use.
                      google: [
                        'https://www.googleapis.com/auth/drive.readonly',
                      ],
                    },
                  }}
                />
              </SignedIn>
            </header>

            <OnboardingTrigger>
              <Toaster position="top-center" />
              {children}
            </OnboardingTrigger>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
