'use client'
import React, { useEffect, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { SigninMessage } from '@/utils/signMessage'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import bs58 from 'bs58'

import styles from '../styles/header.module.scss'

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
  )
  const nonce = Math.floor(Math.random() * 100000000)

  const handleLogin = useCallback(async () => {
    try {
      const callbackUrl = '/'

      if (!wallet.connected) {
        walletModal.setVisible(true)
      }

      if (!wallet.publicKey || !wallet.signMessage) return

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `Sign this message to sign in to the app.`,
        nonce: nonce.toString()
      })

      const data = new TextEncoder().encode(message.prepare())
      const signature = await wallet.signMessage(data)
      const serializedSignature = bs58.encode(signature)

      signIn('credentials', {
        message: JSON.stringify(message),
        redirect: true,
        signature: serializedSignature,
        callbackUrl
      })
    } catch (error) {
      console.log(error)
    }
  }, [nonce, wallet, walletModal])

  useEffect(() => {
    console.log(`wallet details is ${wallet.wallet}`)
    if (wallet.disconnecting) {
      signOut({ callbackUrl: '/' })
    }
  }, [wallet])

  useEffect(() => {
    if (wallet.connected && status === 'unauthenticated') {
      console.log('handle login useEffect')
      handleLogin()
    }
  }, [wallet.connected])

  return (
    <header
      className={`${
        pathname === '/sign-in'
          ? 'top-4 border-b border-[#1a1a1a] pt-2 pb-4 px-4'
          : 'top-0'
      } ${styles['c-header']} flex sticky sm:top-0 z-50 justify-end w-full h-auto shrink-0 bg-transparent`}
    >
      {/* <div className="flex items-start ml-2">
        <Image alt="ocada" src="/OCADA.svg" width={100} height={100} />
      </div> */}
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
