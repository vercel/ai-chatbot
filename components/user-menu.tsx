'use client'

import * as React from 'react'
import { signIn } from '@auth/nextjs/client'
import { type Session } from '@auth/nextjs/types'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
        {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Login
      </Button>
    )
  }

  return (
    <p className="px-2 text-sm font-medium">Logged in as {session.user.name}</p>
  )
}
