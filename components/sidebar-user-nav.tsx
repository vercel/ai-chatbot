'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

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
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';
import { ProfileDialog } from './profile-dialog';
import { AdminDialog } from './admin-dialog';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isGuest = user?.email ? guestRegex.test(user.email) : false;
  const isAdmin = user?.role === 'admin';

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({
        callbackUrl: '/login',
        redirect: false,
      });
      router.push('/login');
    } catch (error) {
      setIsSigningOut(false);
      toast({
        type: 'error',
        description: `Error signing out: ${String(error)}`,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton data-testid="user-nav-button" className="h-10">
            <div className="flex items-center gap-2">
              {user?.image ? (
                <div className="relative w-6 h-6 overflow-hidden rounded-full">
                  <Image
                    width={24}
                    height={24}
                    alt="User avatar"
                    src={user.image}
                    className="object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10" />
              )}
              <span className="truncate max-w-32">
                {user?.name || user?.email?.split('@')[0]}
              </span>
            </div>
            <ChevronUp className="w-4 h-4 ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {isAdmin && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsAdminOpen(true)}
            >
              Admin Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsProfileOpen(true)}
          >
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? 'Light' : 'Dark'} Theme
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSigningOut || isGuest}
            onClick={handleSignOut}
            className="cursor-pointer"
          >
            {isSigningOut ? (
              <div className="flex items-center gap-2">
                <LoaderIcon />
                <span>Signing Out</span>
              </div>
            ) : (
              'Sign Out'
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <ProfileDialog
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Admin Dialog - Only shown for admin users */}
      {isAdmin && (
        <AdminDialog
          user={user}
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </>
  );
}
