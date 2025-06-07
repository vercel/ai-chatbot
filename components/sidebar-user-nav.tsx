/**
 * @file components/sidebar-user-nav.tsx
 * @description Компонент меню пользователя.
 * @version 1.2.0
 * @date 2024-07-12
 * @updated Исправлены классы Tailwind.
 * @updated Improved avatar display with fallback to initials and preferred user.image.
 */

/** HISTORY:
 * v1.2.0 (2024-07-12): Improved avatar display with fallback to initials and preferred user.image.
 * v1.1.1 (2025-06-06): Исправлены классы Tailwind.
 * v1.1.0 (2025-06-05): Упрощен для использования в глобальном хедере. Триггер теперь только аватар.
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
  const [avatarError, setAvatarError] = React.useState(false);

  if (!user.email) return null // Essential for avatar generation and as a key user identifier

  const imageSrc = user.image;
  const effectiveSrc = !avatarError && imageSrc ? imageSrc : (!avatarError && user.email ? `https://avatar.vercel.sh/${user.email}` : null);
  const altText = user.name || user.email || 'User avatar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          {effectiveSrc ? (
            <Image
              key={effectiveSrc} // Re-render if src changes (e.g., from default to user.image after load)
              src={effectiveSrc}
              alt={altText}
              width={32}
              height={32}
              className="rounded-full"
              onError={() => { setAvatarError(true); }}
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
              <span>{getInitials(user.name, user.email)}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="font-normal" disabled>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'My Account'}</p>
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
