'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'

interface LoginButtonConfiguration {
  githubEnabled?: boolean
  googleEnabled?: boolean
}

interface LoginButtonProps extends ButtonProps {
  text?: string
}

function GitHubLoginButton({
  text = 'Login with GitHub',
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        // next-auth signIn() function doesn't work yet at Edge Runtime due to usage of BroadcastChannel
        signIn('github', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="animate-spin" />
      ) : (
        <IconGitHub />
      )}
      <span className="ml-2 hidden md:flex">{text}</span>
    </Button>
  )
}

function GoogleLoginButton({
  text = "Login with Google",
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        // next-auth signIn() function doesn't work yet at Edge Runtime due to usage of BroadcastChannel
        signIn('google', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="animate-spin" />
      ) : (
        <IconGoogle />
      )}
      <span className="ml-2 hidden md:flex">{text}</span>
    </Button>
  )
}

export function LoginButton({ githubEnabled, googleEnabled }: LoginButtonConfiguration) {
  return (
    <div className="flex items-center justify-end space-x-2">
      {githubEnabled ? <GitHubLoginButton /> : null}
      {googleEnabled ? <GoogleLoginButton /> : null}
    </div>
  )
}
