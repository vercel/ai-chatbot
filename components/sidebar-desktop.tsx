'use client'
import { Sidebar } from '@/components/sidebar'

import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history'
import { useSidebar } from '@/lib/hooks/use-sidebar'

export function SidebarDesktop() {
  const session = auth()

  const { isSidebarOpen } = useSidebar()

  return (
    <>
      <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
        <ChatHistory />
      </Sidebar>
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-20 bg-zinc-400 opacity-50 top-10" />
      ) : null}
    </>
  )
}
