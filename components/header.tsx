'use client'
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
// import { ConnectButton } from '@rainbow-me/rainbowkit'
import styles from '../styles/header.module.scss'
import dynamic from "next/dynamic";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";



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
  const wallet = useWallet();
  const { connection } = useConnection();

  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
  );
  
  return (
    // <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-2 lg:px-20 shrink-0 bg-transparent">
    //   <div className="flex items-start ml-10">
    //     <Image alt="ocada" src="/OCADA.svg" width={100} height={100} />
    //   </div>
    //   <ConnectButton />
    //   </div>
    // </header>

    <header
      className={`${styles['c-header']} sticky top-0 z-50 flex items-center justify-between w-full h-16 px-2 lg:px-20 shrink-0 bg-transparent`}
    >
      <div className="flex items-start ml-2">
        <Image alt="ocada" src="/OCADA.svg" width={100} height={100} />
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="/"
          rel="noopener noreferrer"
          className={
            (cn(buttonVariants({ variant: 'outline' })), 'hidden lg:flex')
          }
        >
          {/* <IconGitHub /> */}
          <span className="ml-2 text-type-600 text-sm text-opacity-80">
            Plugins
          </span>
        </a>

        {/* <a
        href="/"
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'bg-type-alt-500 text-black hover:bg-type-alt-700 hover:text-black'
        )}
      >
        <span className="hidden sm:block">Connect Wallet</span>

        <span className="sm:hidden">Connect</span>
      </a> */}

        {/* <ConnectButton /> */}
        <WalletMultiButtonDynamic   className={cn(
          buttonVariants({ variant: 'outline' }),
          'bg-type-alt-500 text-black hover:bg-type-alt-700 hover:text-black'
        )}/>

      </div>
    </header>
  )
}
