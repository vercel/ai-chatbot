import Link from 'next/link'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
// import { Analytics } from '@vercel/analytics/react';
import {
  Logo,
  SettingsIcon,
  UsersIcon,
  VercelLogo
} from '@/components/assets/icons'
import { User } from './user'
import { NavItem } from './nav-item'

import '../globals.css'
import { SuperBrainLogo } from '@/components/assets/logo/SuperBrain'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Next.js App Router + NextAuth + Tailwind CSS',
  description:
    'A user admin dashboard configured with Next.js, Postgres, NextAuth, Tailwind CSS, TypeScript, and Prettier.'
}

export default function DashboardLayout({
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
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <NavItem href="/">
                <UsersIcon className="h-4 w-4" />
                Users
              </NavItem>
              <NavItem href="/settings">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </NavItem>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 justify-between lg:justify-end">
          <Link
            className="flex items-center gap-2 font-semibold lg:hidden"
            href="/"
          >
            <Logo />
            <span className="">ACME</span>
          </Link>
          <User />
        </header>
        {children}
      </div>
    </div>
  )
}
