'use client'

import * as React from 'react'
import { Sidebar as SidebarIcon } from 'lucide-react'
import { type Session } from '@auth/nextjs/types'
import { signOut } from '@auth/nextjs/client'

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
        <Button variant="ghost" className="w-9 h-9 p-0">
          <SidebarIcon className="w-6 h-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        position="left"
        className="w-[300px] gap-0 top-2 px-4 rounded-r-lg bottom-2 h-auto flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        <div className="flex-1">
          {chats?.length ? (
            <div className="space-y-2 -mx-2 py-4">
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
            <div className="text-center p-8">
              <p className="text-sm text-muted-foreground">
                {session?.user ? <>No chat history</> : <>Login for history</>}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center">
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
