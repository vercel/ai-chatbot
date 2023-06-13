'use client'

import * as React from 'react'
import { type Session } from '@auth/nextjs/types'

import { LoginButton } from '@/components/login-button'

export interface UserMenuProps {
  session?: Session
}

export function UserMenu({ session }: UserMenuProps) {
  if (!session?.user) {
    return (
      <LoginButton variant="ghost" className="[&_svg]:hidden" text="Login" />
    )
  }

  return (
    <p className="px-2 text-sm font-medium truncate w-[100px] sm:w-auto">
      {session.user.name}
    </p>
  )
}
