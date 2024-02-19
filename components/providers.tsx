'use client'
import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThirdwebProvider } from '@thirdweb-dev/react'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

// import { alchemyProvider } from "wagmi/providers/alchemy";

import { RainbowKitSiweNextAuthProvider, GetSiweMessageOptions,} from '@rainbow-me/rainbowkit-siwe-next-auth'

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'


const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '5b57a51af4e4791c162c27c317bebbeb',
  chains: [mainnet, polygon, optimism, arbitrum, base, zora],
  ssr: false
})

const queryClient = new QueryClient()

// const getSiweMessageOptions: GetSiweMessageOptions = () => ({
//   statement: 'Sign in to my RainbowKit app',
// });


export function Providers({ children, session, ...props }: ThemeProviderProps & { session?: Session }) {
  const getSiweMessageOptions: GetSiweMessageOptions = () => ({
    statement: 'Sign in to my RainbowKit app',
  });


  return (
    <WagmiProvider config={config}>
      <SessionProvider refetchInterval={0} session={session}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider getSiweMessageOptions={getSiweMessageOptions}>
            <RainbowKitProvider
              modalSize="compact"
              showRecentTransactions={true}
            >
              <NextThemesProvider {...props}>
                <SidebarProvider>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </SidebarProvider>
              </NextThemesProvider>
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  )
}
