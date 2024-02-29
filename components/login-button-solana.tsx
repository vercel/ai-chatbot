'use client'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  IconMetamask,
  IconSpinner,
  IconSolana,
  IconOcada
} from '@/components/ui/icons'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { SigninMessage } from '@/utils/signMessage'
import bs58 from 'bs58'

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean
  text?: string
}

export function LoginButtonSolana({
  text = 'Login with Solana',
  showIcon = true,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const nonce = Math.floor(Math.random() * 100000000)
  const wallet = useWallet()
  const walletModal = useWalletModal()

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const callbackUrl = '/'

      if (!wallet.connected) {
        walletModal.setVisible(true)
      }

      if (!wallet.publicKey || !wallet.signMessage) return

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `By connecting a wallet, you agree to ocada’s Terms and Conditions and acknowledge that you’ve read and understand the protocol documentation and associated risks.`,
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
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col justify-center text-center mt-[-120px] items-center">
        <article className="flex justify-center flex-col items-center mb-6">
          <IconOcada className="size-20" />
          <h4 className="font-semibold text-3xl">Get started</h4>
          <p className="opacity-60 max-w-80">
            Select wallet{' '}
            <span className="inline-flex size-5 bg-white rounded-full justify-center items-center relative top-1 mx-1 opacity-100">
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.1207 13.436L15.8208 7.75616L10.141 7.05603M6.88673 14.7294L15.7315 7.8259"
                  stroke="#020617"
                  strokeWidth="1.08816"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>{' '}
            and connect then click on the lauch app button below.
          </p>
        </article>
        <Button
          variant="outline"
          onClick={() => {
            setIsLoading(true)
            handleLogin()
          }}
          disabled={isLoading || !wallet.connected}
          className="w-48 h-12"
          {...props}
        >
          {isLoading ? (
            <IconSpinner className="m-4 animate-spin size-14" />
          ) : showIcon ? (
            <>Lauch App</>
          ) : null}
          {/* <span className="pl-4 text-[20px]">{text}</span> */}
        </Button>
      </div>
    </div>
  )
}
