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
    <header className="h-16 shrink-0 z-50 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-lg px-4 flex sticky top-0 w-full items-center justify-between">
      <div className="flex items-center w-2/5">
        {/* @ts-ignore */}
        <Sidebar chats={chats} session={session} />
        <Separator className="h-6 w-6 text-muted-foreground/50" />
        <UserMenu session={session} />
      </div>
      <div className="flex space-x-2 items-center justify-end w-2/5">
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
          Deploy to Vercel
        </a>
      </div>
    </header>
  )
}
