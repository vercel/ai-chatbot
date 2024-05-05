import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import type { Metadata } from 'next'
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { dark } from '@clerk/themes'
import '../globals.css'
import { IconSpinner } from '@/components/ui/icons'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Auth',
  description: 'An AI-powered chatbot template built with Next.js and Vercel.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body
          className={cn(
            'font-sans antialiased bg-dark-1',
            GeistSans.variable,
            GeistMono.variable
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClerkLoading>
              <div className="flex items-center justify-center h-screen">
                <IconSpinner className="size-8" />
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <main className="flex items-center justify-center h-screen w-full">
                {children}
              </main>
            </ClerkLoaded>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
