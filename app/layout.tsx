import { Toaster } from 'react-hot-toast'
import localFont from 'next/font/local'
// import { GeistSans } from 'geist/font/sans'
// import { GeistMono } from 'geist/font/mono'
// import { Gabarito } from "next/font/google";
// import { Rethink_Sans } from 'next/font/google'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'

export const metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: {
    default: 'Ocada',
    template: `%s - AI Agent`
  },
  description:
    'Optimized Computational Algorithms for Distributed Artificial Intelligence',
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

const Gabarito = localFont({
  src: [
    {
      path: '../public/fonts/Gabarito-Regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/Gabarito-Medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../public/fonts/Gabarito-SemiBold.woff2',
      weight: '600',
      style: 'normal'
    }
  ],
  variable: '--font-gabarito'
})

const Rethink_Sans = localFont({
  src: [
    {
      path: '../public/fonts/RethinkSans-Regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/RethinkSans-Medium.woff2',
      weight: '500',
      style: 'normal'
    }
  ],
  variable: '--font-rethink_sans'
})

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          Rethink_Sans.variable,
          Gabarito.variable
        )}
      >
        <Toaster />
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex flex-col flex-1 h-screen bg-[#121212]">
            {children}
          </main>
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  )
}
