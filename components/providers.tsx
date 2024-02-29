'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { useMemo } from 'react'
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import "@solana/wallet-adapter-react-ui/styles.css"
import { SessionProvider } from 'next-auth/react'

export function Providers({ children,  ...props }: ThemeProviderProps)  {
  const wallets = useMemo(() => [new PhantomWalletAdapter(),], []);

  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <NextThemesProvider {...props}>
              <SidebarProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </SidebarProvider>
            </NextThemesProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>   
    </SessionProvider>
  )
}


