import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { getChats } from '@/app/actions'
import { buttonVariants } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import { GitHub, Separator, Vercel } from '@/components/icons'
import { Sidebar } from '@/components/sidebar'

export async function Header() {
  const session = await auth()
  const chats = session?.user?.email ? await getChats(session.user.email) : []

  return (
    <header className="h-16 shrink-0 z-50 border-b bg-gradient-to-b from-background/10 via-background/50 backdrop-blur-xl to-background/80 px-4 flex sticky top-0 w-full items-center justify-between">
      <div className="flex items-center">
        {/* @ts-ignore */}
        <Sidebar chats={chats} session={session} />
        <div className="hidden md:flex items-center">
          <Separator className="h-6 w-6 text-muted-foreground/50" />
          <UserMenu session={session} />
        </div>
      </div>
      <div className="flex space-x-2 items-center justify-end">
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
