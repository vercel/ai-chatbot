'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useUser, UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LoaderIcon } from './icons';

export function SidebarUserNav() {
  const { user, isLoaded } = useUser();
  const { setTheme, resolvedTheme } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // During SSR and initial hydration, render a consistent placeholder
  if (!isHydrated || !isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            data-testid="user-nav-button"
            className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex flex-row gap-2">
              <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
              <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                Loading user...
              </span>
            </div>
            <ChevronUp className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              data-testid="user-nav-button"
              className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Image
                src={user.imageUrl || `https://avatar.vercel.sh/${user.primaryEmailAddress?.emailAddress}`}
                alt={user.primaryEmailAddress?.emailAddress ?? 'User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span data-testid="user-email" className="truncate">
                {user.primaryEmailAddress?.emailAddress}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-(--radix-popper-anchor-width)"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <div className="w-full">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonTrigger: 'w-full justify-start',
                      userButtonAvatarBox: 'w-6 h-6',
                    },
                  }}
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
