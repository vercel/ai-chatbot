'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import Image from 'next/image'
import styles from '../styles/header.module.scss'
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { signOut } from 'next-auth/react'

export function Header() {
  const wallet = useWallet();
  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
  );
  
  useEffect(()=>{
    if(wallet.disconnecting){
      signOut({ callbackUrl: '/' })
    }
  }, [wallet])

  return (
    <header
      className={`${styles['c-header']} sticky top-0 z-50 flex items-center justify-between w-full h-16 px-2 lg:px-20 shrink-0 bg-transparent`}
    >
      <div className="flex items-start ml-2">
        <Image alt="ocada" src="/OCADA.svg" width={100} height={100} />
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="/"
          rel="noopener noreferrer"
          className={
            (cn(buttonVariants({ variant: 'outline' })), 'hidden lg:flex')
          }
        >
          <span className="ml-2 text-type-600 text-sm text-opacity-80">
            Plugins
          </span>
        </a>
          <WalletMultiButtonDynamic   className={cn(
            buttonVariants({ variant: 'outline' }),
            'bg-type-alt-500 text-black hover:bg-type-alt-700 hover:text-black'
          )}/>
          { wallet.publicKey && ( <></> ) }
      </div>
    </header>
  )
}