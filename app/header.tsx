import { GitHub, Vercel } from '@/components/icons'
import './globals.css'

import { Sidebar } from '@/app/sidebar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'
import { auth } from '@/auth'

export async function Header() {
  const session = await auth()

  return (
    <header className="h-16 shrink-0 z-50 bg-gradient-to-b from-background/30 to-background/50 backdrop-blur-lg px-4 flex sticky top-0 w-full items-center justify-between">
      <div className="flex items-center">
        {/* @ts-ignore */}
        <Sidebar />
        <UserMenu session={session} />
      </div>
      <div className="flex space-x-2 items-center">
        <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Link>
        <a
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          target="_blank"
          className={cn(
            buttonVariants({ size: 'sm', variant: 'outline' }),
            'space-x-2'
          )}
        >
          <Vercel className="mr-2" />
          Deploy
        </a>
        <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          className={cn(
            buttonVariants({ size: 'sm', variant: 'ghost' }),
            'h-9 w-9 p-0'
          )}
        >
          <GitHub className="w-5 h-5" />
          <span className="sr-only">View on GitHub</span>
        </a>
      </div>
    </header>
  )
}
