'use client';

import { Session } from 'next-auth';
import React from 'react';
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { CrossIcon, MoreHorizontalIcon, TrashIcon, UserIcon } from './icons';
import { useTheme } from 'next-themes';
import { SignOutForm } from './sign-out-form';

interface UserDropdownProps {
  session: Session;
}

export function UserDropdown({ session }: UserDropdownProps) {
  const { theme, setTheme } = useTheme();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center rounded-full overflow-hidden border-2 border-border hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
              <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <MoreHorizontalIcon size={16} className="mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunIconCustom className="mr-2" /> : <MoonIconCustom className="mr-2" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSignOutConfirm(true)}>
            <TrashIcon size={16} className="mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showSignOutConfirm && (
        <SignOutForm onClose={() => setShowSignOutConfirm(false)} />
      )}
    </>
  );
}

// Custom icons to replace the missing ones
function SunIconCustom({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      className={className}
      style={{ color: 'currentcolor' }}
    >
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.5 3.5L5 5M12.5 3.5L11 5M3.5 12.5L5 11M12.5 12.5L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIconCustom({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      className={className}
      style={{ color: 'currentcolor' }}
    >
      <path 
        d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C8.6428 2.5 9.26114 2.6013 9.83861 2.7887C9.10803 3.45386 8.63216 4.41603 8.63216 5.48996C8.63216 7.53626 10.2859 9.18996 12.3322 9.18996C12.6063 9.18996 12.8742 9.16048 13.1321 9.1051C13.3935 8.76278 13.5 8.3709 13.5 8Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
    </svg>
  );
}