import { useState } from 'react'
import { signOut } from 'next-auth/react'
import type { User } from 'next-auth'
import { 
  ChevronsUpDown, 
  LogOut, 
  User as UserIcon, 
  Mail,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarUserNavProps {
  user: User
}

export function SidebarUserNav({ user }: SidebarUserNavProps) {
  const { isMobile } = useSidebar()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
             
            >
              <Avatar className="h-6 w-6 rounded-full flex-shrink-0">
                <AvatarImage 
                  src={user.image || undefined} 
                  alt={user.name || 'User'} 
                />
                <AvatarFallback className="rounded-full">
                  {user.name
                    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : <UserIcon className="size-4" />
                  }
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold">
                  {user.name || 'User'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full flex-shrink-0">
                  <AvatarImage 
                    src={user.image || undefined} 
                    alt={user.name || 'User'} 
                  />
                  <AvatarFallback className="rounded-full">
                    {user.name
                      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : <UserIcon className="size-4" />
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-semibold">
                    {user.name || 'User'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
             */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 text-red-600 focus:text-red-600"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="size-4" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
