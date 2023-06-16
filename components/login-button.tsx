'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'

interface LoginButtonProps extends ButtonProps {
  text?: string
}

export function LoginButton({ className, ...props }: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="link"
      onClick={() => {
        setIsLoading(true)
        signIn('github')
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading && <IconSpinner className="mr-2 animate-spin" />}
      Login
    </Button>
  )
}
