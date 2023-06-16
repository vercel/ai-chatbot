import { Suspense, use } from 'react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { SidebarList } from '@/components/sidebar-list'
import { IconGitHub, IconSeparator, IconVercel } from '@/components/ui/icons'

import { SidebarFooter } from '@/components/sidebar-footer'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'
import { clearChats } from '@/app/actions'
import Link from 'next/link'
import { auth } from '@/auth'
import { UserMenu } from './ui/user-menu'
import { LoginButton } from './login-button'

export async function Header() {
  const session = await auth()
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        {session?.user ? (
          <Sidebar>
            <Suspense fallback={<div className="flex-1 overflow-auto" />}>
              {/* @ts-ignore */}
              <SidebarList userId={session?.user?.id} />
            </Suspense>
            <SidebarFooter>
              <ThemeToggle />
              <ClearHistory clearChats={clearChats} />
            </SidebarFooter>
          </Sidebar>
        ) : (
          <Link href="https://vercel.com" target="_blank" rel="nofollow">
            <IconVercel className="w-6 h-6 mr-2" />
          </Link>
        )}
        <div className="flex items-center">
          <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
          {session?.user ? <UserMenu session={session} /> : <LoginButton />}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2">
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
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <IconVercel className="mr-2" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Deploy</span>
        </a>
      </div>
    </header>
  )
}
