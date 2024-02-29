'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import Image from 'next/image'
import styles from '../styles/header.module.scss'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { signOut } from 'next-auth/react'
import { IconOcada } from '@/components/ui/icons'

export function Header() {
  const pathname = usePathname()
  console.log(pathname)
  const wallet = useWallet()
  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
  )

  useEffect(() => {
    console.log(`wallet details is ${wallet.wallet}`)
    if (wallet.disconnecting) {
      signOut({ callbackUrl: '/' })
    }
  }, [wallet])

  return (
    <header
      className={`${
        pathname === '/sign-in'
          ? 'top-4 border-b border-[#1a1a1a] pt-2 pb-4 px-4'
          : 'top-0'
      } ${styles['c-header']} flex sticky sm:top-0 z-50 justify-end w-full h-auto shrink-0 bg-transparent`}
    >
      <div className="flex items-center justify-end space-x-2 w-full">
        <div className="flex items-center gap-4">
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
          <WalletMultiButtonDynamic
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'bg-type-alt-500 text-black hover:bg-type-alt-700 hover:text-black'
            )}
          />
          {wallet.publicKey && <></>}
        </div>
      </div>
    </header>
  )
}
