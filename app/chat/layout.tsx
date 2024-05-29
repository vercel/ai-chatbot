import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { cn } from '@/lib/utils'

import { SidebarDesktop } from '@/components/sidebar-desktop'
import '@/app/globals.css'
import { Header } from '@/components/header'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div
      className={cn(
        'font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <Header />
      <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
        <SidebarDesktop />
        {children}
      </div>
    </div>
  )
}
