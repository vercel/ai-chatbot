'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { signOut } from 'next-auth/react'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

// wallet-connect on siwe
// import '@rainbow-me/rainbowkit/styles.css';
// import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
// import { WagmiProvider, useAccountEffect } from 'wagmi';
// import {
//   mainnet,
//   polygon,
//   optimism,
//   arbitrum,
//   base,
//   zora,
// } from 'wagmi/chains';
// import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// const config = getDefaultConfig({
//   appName: 'My RainbowKit App',
//   projectId: "5b57a51af4e4791c162c27c317bebbeb",
//   chains: [mainnet, polygon, optimism, arbitrum, base, zora],
//   ssr: false,
// });

// const queryClient = new QueryClient();

//wallet-connect on sol
import { ConnectionProvider, WalletProvider, useAnchorWallet } from "@solana/wallet-adapter-react"
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import "@solana/wallet-adapter-react-ui/styles.css"
import { useEffect, useMemo, useState } from 'react'
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export function Providers({ children,  ...props }: ThemeProviderProps)  {
  const [mounted, setMounted] = useState(false)
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  useEffect(() => {
      setMounted(true)
  }, [])


  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

// function WalletEventHook() {
//   useAccountEffect({
//     onDisconnect() {
//       signOut({ callbackUrl: '/' })
//     },
//   })
//   return <></>
// }

  return (
    // <WagmiProvider config={config}>
    //   <QueryClientProvider client={queryClient}>
    //     <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
    //       <WalletEventHook/>
    //       <NextThemesProvider {...props}>
    //         <SidebarProvider>
    //           <TooltipProvider>{children}</TooltipProvider>
    //         </SidebarProvider>
    //       </NextThemesProvider>
    //     </RainbowKitProvider>
    //   </QueryClientProvider>
    // </WagmiProvider>

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
  )
}


