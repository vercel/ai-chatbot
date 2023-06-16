import { Suspense } from 'react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { SidebarList } from '@/components/sidebar-list'
import { IconGitHub, IconSeparator, IconVercel } from '@/components/ui/icons'
import { UserButton, currentUser } from '@clerk/nextjs'
import { SidebarFooter } from '@/components/sidebar-footer'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'
import { clearChats } from '@/app/actions'

export async function Header() {
  const user = await currentUser()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center">
        {/* @ts-ignore */}
        <Sidebar user={user?.id}>
          <Suspense fallback={<div className="flex-1 overflow-auto" />}>
            {/* @ts-ignore */}
            <SidebarList userId={user?.id} />
          </Suspense>
          <SidebarFooter>
            <ThemeToggle />
            <ClearHistory clearChats={clearChats} />
          </SidebarFooter>
        </Sidebar>
        <div className="flex items-center">
          <IconSeparator className="h-6 w-6 text-muted-foreground/50" />
          <UserButton
            showName
            appearance={{
              elements: {
                avatarBox: 'w-6 h-6 rounded-full overflow-hidden',
                userButtonBox: 'flex-row-reverse',
                userButtonOuterIdentifier: 'text-primary',
                userButtonPopoverCard:
                  'shadow-lg rounded-lg p-0 border border-border w-[200px] dark:bg-zinc-950 dark:text-zinc-50',
                userButtonPopoverFooter:
                  'p-4 border-t border-border [&>*]:dark:text-zinc-600',
                userPreview: 'p-4 border-b border-border m-0',
                userButtonPopoverActionButton: 'px-1 gap-1',
                userButtonPopoverActionButtonText:
                  'text-sm tracking-normal dark:text-zinc-400',
                userButtonPopoverActionButtonIcon:
                  'h-4 w-4 text-muted-foreground'
              }
            }}
          />
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
          <span className="ml-2 hidden md:flex">GitHub</span>
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
