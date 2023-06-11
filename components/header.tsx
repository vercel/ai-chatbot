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
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        {/* @ts-ignore */}
        <Sidebar session={session}>
          <Suspense fallback={<div className="flex-1 overflow-auto" />}>
            {/* @ts-ignore */}
            <SidebarList session={session} />
          </Suspense>
        </Sidebar>
        <div className="items-center hidden md:flex">
          <Separator className="w-6 h-6 text-muted-foreground/50" />
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
          <GitHub className="w-4 h-4 mr-2" />
          <span>GitHub</span>
        </a>
        <a
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <Vercel className="w-4 h-4 mr-2" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Vercel</span>
        </a>
      </div>
    </header>
  )
}
