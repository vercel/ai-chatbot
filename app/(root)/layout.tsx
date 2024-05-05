import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { IconSpinner } from '@/components/ui/icons'

export const metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : undefined,
  title: {
    default: 'Next.js AI Chatbot',
    template: `%s - Next.js AI Chatbot`
  },
  description: 'An AI-powered chatbot template built with Next.js and Vercel.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            'font-sans antialiased',
            GeistSans.variable,
            GeistMono.variable
          )}
        >
          <Toaster position="top-center" />
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <ClerkLoading>
                <div className="flex items-center justify-center h-screen">
                  <IconSpinner className="size-8" />
                </div>
              </ClerkLoading>
              <ClerkLoaded>
                <main className="flex flex-col flex-1 bg-muted/50">
                  {children}
                </main>
              </ClerkLoaded>
            </div>
            <TailwindIndicator />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
