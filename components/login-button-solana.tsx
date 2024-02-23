'use client'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconMetamask, IconSpinner, IconSolana } from '@/components/ui/icons'
import { signIn } from "next-auth/react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { SigninMessage } from '@/utils/signMessage'
import bs58 from "bs58";

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
  const nonce = Math.floor(Math.random() * 100000000);
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const callbackUrl = "/"

      if (!wallet.connected) {
        walletModal.setVisible(true);
      }

      if (!wallet.publicKey || !wallet.signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `Sign this message to sign in to the app.`,
        nonce: nonce.toString(),
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await wallet.signMessage(data);
      const serializedSignature = bs58.encode(signature);

      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: true,
        signature: serializedSignature,
        callbackUrl,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Button
      variant="outline"
      onClick={()=>{
        setIsLoading(true)
        handleLogin()
      }
    }
      disabled={ isLoading || !wallet.connected }
      className="w-128 h-16"
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showIcon ? (
        <IconSolana className="mr-2" />
      ) : null}
      {/* <span className="pl-4 text-[20px]">{text}</span> */}
    </Button>
  )
}
