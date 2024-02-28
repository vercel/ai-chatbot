import Component from '@/components/right-sidebar'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import { Header } from '@/components/header'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <SidebarDesktop />
      <div className="group w-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:ml-[240px] peer-[[data-state=open]]:xl:ml-[240px] bg-[#101010] m-3 rounded-2xl border border-[#1a1a1a]">
        <Header />
        {children}
      </div>
      <Component />
    </div>
  )
}
