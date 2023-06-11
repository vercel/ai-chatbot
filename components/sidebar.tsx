'use client'

import * as React from 'react'
import { signOut } from '@auth/nextjs/client'
import { type Session } from '@auth/nextjs/types'
import { Sidebar as SidebarIcon } from 'lucide-react'

import { type Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { SidebarItem } from '@/components/sidebar-item'
import { ThemeToggle } from '@/components/theme-toggle'

export interface SidebarProps {
  session?: Session
  chats: Chat[]
}

export async function Sidebar({ session, chats }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="-ml-2 h-9 w-9 p-0">
          <SidebarIcon className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        position="left"
        className="inset-y-0 flex h-auto w-[300px] flex-col gap-0 rounded-r-lg p-0 lg:inset-y-2"
      >
        <SheetHeader className="p-4">
          <SheetTitle className="text-sm">Chat History</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          {chats?.length ? (
            <div className="space-y-2 px-2">
              {chats.map(chat => (
                <SidebarItem
                  key={chat.id}
                  title={chat.title}
                  userId={session?.user?.email ?? ''}
                  href={`/chat/${chat.id}`}
                  id={chat.id}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {session?.user ? <>No chat history</> : <>Login for history</>}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center p-4">
          <ThemeToggle />
          {session?.user && (
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="ml-auto"
            >
              Logout
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
