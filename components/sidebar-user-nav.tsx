'use client';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useUser, useClerk } from '@clerk/nextjs';

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

export function SidebarUserNav() {
  const { setTheme, theme } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) {
    return null;
  }

  const userEmail = user.primaryEmailAddress?.emailAddress ?? 'Loading...';
  const userImageUrl = user.imageUrl;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10">
              <Image
                src={userImageUrl}
                alt={userEmail ?? 'User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="truncate">{userEmail}</span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              Toggle theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
