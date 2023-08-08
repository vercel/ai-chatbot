'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'

interface GithubLoginButtonProps extends ButtonProps {
  text?: string
}

export function GithubLoginButton({
  text = 'Login with GitHub',
  className,
  ...props
}: GithubLoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        signIn('github', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? <IconSpinner className="mr-2 animate-spin" /> : <IconGitHub className="mr-2" />}
      {text}
    </Button>
  )
}

interface GoogleLoginButtonProps extends ButtonProps {
  text?: string
}

export function GoogleLoginButton({
  text = 'Login with Google',
  className,
  ...props
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        signIn('google', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? <IconSpinner className="mr-2 animate-spin" /> : <IconGoogle className="mr-2" />}
      {text}
    </Button>
  )
}