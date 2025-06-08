/**
 * @file components/sidebar-user-nav.tsx
 * @description Компонент меню пользователя.
 * @version 1.3.0
 * @date 2025-06-07
 * @updated Улучшено отображение аватара с фоллбэком на инициалы и приоритетом `user.image`.
 */

/** HISTORY:
 * v1.3.0 (2025-06-07): Улучшено отображение аватара с фоллбэком на инициалы.
 * v1.2.0 (2024-07-12): Исправлены классы Tailwind.
 * v1.1.1 (2025-06-06): Исправлены классы Tailwind.
 * v1.1.0 (2025-06-05): Упрощен для использования в глобальном хедере.
 * v1.0.0 (2025-06-05): Начальная версия.
 */

'use client'

import * as React from 'react'
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

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
       if (nameParts[0].length > 1) return (nameParts[0][0] + nameParts[0][1]).toUpperCase();
       return nameParts[0][0].toUpperCase();
    }
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '';
}

export function SidebarUserNav ({ user }: { user: User }) {
  const [avatarError, setAvatarError] = React.useState(!user.image);

  if (!user.email) return null

  const imageSrc = !avatarError && user.image ? user.image : `https://avatar.vercel.sh/${user.email}`;
  const altText = user.name || user.email || 'User avatar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          {avatarError ? (
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
              <span>{getInitials(user.name, user.email)}</span>
            </div>
          ) : (
            <Image
              key={imageSrc}
              src={imageSrc}
              alt={altText}
              width={32}
              height={32}
              className="rounded-full bg-muted"
              onError={() => { setAvatarError(true); }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="font-normal" disabled>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'My Account'}</p>
            <p data-testid="user-email" className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// END OF: components/sidebar-user-nav.tsx
