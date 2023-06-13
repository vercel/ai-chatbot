'use client'

import * as React from 'react'
import { signIn } from '@auth/nextjs/client'
import { type Session } from '@auth/nextjs/types'

import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'

export interface UserMenuProps {
  session?: Session
}

export function UserMenu({ session }: UserMenuProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsLoading(true)
          signIn('github')
        }}
        disabled={isLoading}
      >
        {isLoading && <IconSpinner className="mr-2 animate-spin" />}
        Login
      </Button>
    )
  }

  return (
    <p className="px-2 text-sm font-medium">Logged in as {session.user.name}</p>
  )
}
