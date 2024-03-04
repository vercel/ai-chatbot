'use client'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconMetamask, IconSpinner } from '@/components/ui/icons'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from "siwe"
import { signIn } from "next-auth/react"

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean
  text?: string
}

export function LoginButtonMetamask({
  text = 'Login with Metamask',
  showIcon = true,
  className,
  ...props
}: LoginButtonProps) {

  const [isLoading, setIsLoading] = useState(false)
  const { signMessageAsync } = useSignMessage()
  const { address, isConnected, chain } = useAccount()
  const nonce = Math.floor(Math.random() * 100000000);

  const handleLogin = async () => {
    try {
      const callbackUrl = "/"
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id,
        nonce: nonce.toString(),
      })
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: true,
        signature,
        nonce:nonce,
        callbackUrl,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
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
      disabled={isLoading || !address || !isConnected}
      className="w-128 h-16"
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showIcon ? (
        <IconMetamask className="mr-2" />
      ) : null}
      <span className="pl-4 text-[20px]">{text}</span>
    </Button>
  )
}
