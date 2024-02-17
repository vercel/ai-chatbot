import { Toaster } from 'react-hot-toast'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'

// import { ThirdwebSDKProvider } from "@thirdweb-dev/react";
// import { ethers } from "ethers";

export const metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: {
    default: 'OCADA AI',
    template: `OCADA AI`
  },
  description: 'OCADA AI Agent.',
  icons: {
    icon: '/OCADA.svg',
    shortcut: '/OCADA.svg',
    apple: '/OCADA.svg'
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

      <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Toaster />
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen bg-[#101010]">
            <Header />
            <main className="flex flex-col flex-1">{children}</main>
          </div>
          <TailwindIndicator />
        </Providers>
      </body>
    </html>

            

  )
}
