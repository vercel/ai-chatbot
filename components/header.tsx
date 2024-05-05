import Link from 'next/link'
import * as React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconEdit,
  IconMessage,
  IconNextChat,
  IconSeparator
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { SignedIn, SignedOut, UserButton, currentUser } from '@clerk/nextjs'
import { ChatHistory } from './chat-history'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'

async function UserOrLogin() {
  const user = await currentUser()
  return (
    <>
      <SignedIn>
        <SidebarMobile>
          <ChatHistory userId={user?.id as string} />
        </SidebarMobile>
        <SidebarToggle />
      </SignedIn>
      <SignedOut>
        <Link href="/new" rel="nofollow">
          <IconNextChat className="size-6 mr-2 dark:hidden" inverted />
          <IconNextChat className="hidden size-6 mr-2 dark:block" />
        </Link>
      </SignedOut>
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        <SignedIn>
          {/* <UserMenu /> */}
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
        <SignedOut>
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        </SignedOut>
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
          <IconMessage className="mr-1" />
          <span className="hidden sm:block">AI Chat</span>
          <span className="sm:hidden">Chat</span>
        </Link>
        <Link href="/retrieval" className={cn(buttonVariants({ size: 'sm' }))}>
          <IconEdit className="mr-1" />
          <span className="hidden sm:block">Enhance Content</span>
          <span className="sm:hidden">Enhance</span>
        </Link>
      </div>
    </header>
  )
}
