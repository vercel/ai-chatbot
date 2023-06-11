import { auth } from '@/auth'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { GitHub, Separator, Vercel } from '@/components/icons'
import { Sidebar } from '@/components/sidebar'
import { UserMenu } from '@/components/user-menu'
import { SidebarList } from './sidebar-list'
import { Suspense } from 'react'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center">
        {/* @ts-ignore */}
        <Sidebar session={session}>
          <Suspense fallback={<div className="flex-1 overflow-auto" />}>
            {/* @ts-ignore */}
            <SidebarList session={session} />
          </Suspense>
        </Sidebar>
        <div className="hidden items-center md:flex">
          <Separator className="h-6 w-6 text-muted-foreground/50" />
          <UserMenu session={session} />
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <GitHub className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </a>
        <a
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <Vercel className="mr-2 h-4 w-4" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Vercel</span>
        </a>
      </div>
    </header>
  )
}
