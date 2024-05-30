import Link from 'next/link'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
// import { Analytics } from '@vercel/analytics/react';
import { Logo, SettingsIcon, UsersIcon } from '@/components/assets/icons'

import '../globals.css'
import { SuperBrainLogo } from '@/components/assets/logo/SuperBrain'
import { cn } from '@/lib/utils'
import { Logout } from '@/components/user/logout'
import { NavItem } from '../dashboard/nav-item'
import { SidebarMenu } from '@/components/sidebarMenu/index'

export const metadata = {
  title: 'Next.js App Router + NextAuth + Tailwind CSS',
  description:
    'A user admin dashboard configured with Next.js, Postgres, NextAuth, Tailwind CSS, TypeScript, and Prettier.'
}

export default function AddUserLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid min-h-screen w-full lg:grid-cols-[280px_1fr] ${cn(
        'font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}`}
    >
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-5">
            <Link className="flex items-center gap-2 font-semibold" href="/">
              <SuperBrainLogo />
            </Link>
          </div>
          <SidebarMenu />
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 justify-between lg:justify-end">
          <Logout />
        </header>
        {children}
      </div>
    </div>
  )
}
