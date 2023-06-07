'use client'

import { Button } from '@/components/ui/button'
import { signIn } from '@auth/nextjs/client'
import { type Session } from '@auth/nextjs/types'

export interface UserMenuProps {
  session: Session
}

export function UserMenu({ session }: UserMenuProps) {
  if (!session) {
    return (
      <Button variant="ghost" size="sm" onClick={() => signIn('github')}>
        Login
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-between text-sm">
      {session?.user && (
        <Button variant="link" size="sm">
          {session.user?.name}
        </Button>
      )}
    </div>
  )
}
