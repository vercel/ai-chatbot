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
        {isLoading && <Loader2Icon className="animate-spin w-4 h-4 mr-2" />}
        Login
      </Button>
    )
  }

  return (
    <p className="text-sm font-medium px-2">Logged in as {session.user.name}</p>
  )
}