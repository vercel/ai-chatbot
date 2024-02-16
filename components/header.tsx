import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
// import { auth } from '@/autooh'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconNextChat,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import Image from 'next/image'
// import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'

// async function UserOrLogin() {
//   // const session = await auth()
//   return (
//     <>
//       {session?.user ? (
//         <>
//           <SidebarMobile>
//             <ChatHistory userId={session.user.id} />
//           </SidebarMobile>
//           <SidebarToggle />
//         </>
//       ) : (
//         <Link href="/" target="_blank" rel="nofollow">
//           <IconNextChat className="size-6 mr-2 dark:hidden" inverted />
//           <IconNextChat className="hidden size-6 mr-2 dark:block" />
//         </Link>
//       )}
//       <div className="flex items-center">
//         <IconSeparator className="size-6 text-muted-foreground/50" />
//         {session?.user ? (
//           <UserMenu user={session.user} />
//         ) : (
//           <Button variant="link" asChild className="-ml-2">
//             <Link href="/sign-in?callbackUrl=/">Login</Link>
//           </Button>
//         )}
//       </div>
//     </>
//   )
// }

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-start ml-10">
          <Image alt='ocada' src="/OCADA.svg" width={150} height={150}/>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          {/* <IconGitHub /> */}
          <span className="hidden ml-2 md:flex">Plugins</span>
        </a>
        <a
          href="/"
          
          className={cn(buttonVariants())}
        >
          {/* <IconVercel className="mr-2" /> */}
          <span className="hidden sm:block">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </a>
      </div>
    </header>
  )
}
