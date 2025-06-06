/**
 * @file components/sidebar-user-nav.tsx
 * @description Компонент меню пользователя.
 * @version 1.1.1
 * @date 2025-06-06
 * @updated Исправлены классы Tailwind.
 */

/** HISTORY:
 * v1.1.1 (2025-06-06): Исправлены классы Tailwind.
 * v1.1.0 (2025-06-05): Упрощен для использования в глобальном хедере. Триггер теперь только аватар.
 * v1.0.0 (2025-06-05): Начальная версия.
 */

'use client'

import Image from 'next/image'
import type { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from './ui/button'

export function SidebarUserNav ({ user }: { user: User }) {
  if (!user.email) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          <Image
            src={`https://avatar.vercel.sh/${user.email}`}
            alt={user.email}
            width={32}
            height={32}
            className="rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="font-normal" disabled>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">My Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onSelect={() => signOut({ redirectTo: '/' })}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// END OF: components/sidebar-user-nav.tsx
