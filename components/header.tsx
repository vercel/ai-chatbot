import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconNextChat,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import img from "@/public/logo.svg";

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <>
        <Button variant="link" asChild className="-ml-2 text-md text-zinc-900/[0.8]">
            
        </Button>
        <img src={img.src} alt="Huddlechat Logo" className="w-10 h-8" />
        <Button variant="link" asChild className="-mr-1 text-lg text-zinc-900/[0.8]">
            <Link href="/new">Huddlechat</Link>
        </Button>
        <IconSeparator className="size-8 text-muted-foreground/[0.30]" />
        <Button variant="link" asChild className="-ml-2 text-md text-zinc-900/[0.8]">
            <Link href="/login">Huddlevision</Link>
        </Button>
        <IconSeparator className="size-8 text-muted-foreground/[0.30]" />
        <Button variant="link" asChild className="-ml-2 text-md text-zinc-900/[0.8]">
            <Link href="/login">Enterprise LLM Solutions</Link>
        </Button>
      </>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-8 text-muted-foreground/[0.30]" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2 text-md text-zinc-900/[0.8]">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky bg-white top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      {/* <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <IconGitHub />
          <span className="hidden ml-2 md:flex">GitHub</span>
        </a>
        <a
          href="https://vercel.com/templates/Next.js/nextjs-ai-chatbot"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <IconVercel className="mr-2" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Deploy</span>
        </a>
      </div> */}
    </header>
  )
}
