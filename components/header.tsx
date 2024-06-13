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

import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'

function Example() {
  return (
    <Popover>
      <PopoverButton className="border-none">
        <span className="text-zinc-900/[0.8] font-medium hover:underline">Products</span>
      </PopoverButton>
      <Transition
        enter="duration-200 ease-out"
        enterFrom="scale-95 opacity-0"
        enterTo="scale-100 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="scale-100 opacity-100"
        leaveTo="scale-95 opacity-0"
      >
        <PopoverPanel anchor="bottom" className="flex origin-top flex-col transition bg-white pt-10 pb-3 border rounded-md px-2 ml-3 divide-y divide-white/5">
          <a className="mb-3 block rounded-md px-3 py-4 transition hover:bg-zinc-100/[0.55]" href="/">
            <p className="text-md text-sky-600">Huddlechat</p>
            <p className="text-sm text-muted-foreground">A natural language interface to sports stats.</p>
          </a>
          <a className="mb-3 block rounded-md px-3 py-4 transition hover:bg-zinc-100/[0.55]" href="https://huddlevision.ai">
            <p className="text-md text-sky-600">Huddlevision</p>
            <p className="text-sm text-muted-foreground">Enterprise computer-vision solutions to high school football scouting.</p>
          </a>
          <a className="mb-3 block rounded-md px-3 py-4 transition hover:bg-zinc-100/[0.55]" href="/rag">
            <p className="text-md text-sky-600">RAG Implementations</p>
            <p className="text-sm text-muted-foreground">Custom RAG-based solutions for your sports business.</p>
          </a>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}

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
        <Button variant="link" asChild className="-mr-1 text-lg text-zinc-900/[0.8]">
            <Link href="/new">Huddlechat</Link>
        </Button>
        <IconSeparator className="size-8 text-muted-foreground/[0.30]" />
        <Example/>
      </>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-8 text-muted-foreground/[0.30]" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2 text-md text-zinc-900/[0.8]">
            <Link href="/login">Beta Login</Link>
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
