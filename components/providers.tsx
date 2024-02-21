'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { signOut } from 'next-auth/react'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccountEffect } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  zora,
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: "5b57a51af4e4791c162c27c317bebbeb",
  chains: [mainnet, polygon, optimism, arbitrum, base, zora],
  ssr: false,
});

const queryClient = new QueryClient();

function WalletEventHook() {
  useAccountEffect({
    onDisconnect() {
      signOut({ callbackUrl: '/' })
    },
  })
  return <></>
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
          <WalletEventHook/>
          <NextThemesProvider {...props}>
            <SidebarProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </SidebarProvider>
          </NextThemesProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
