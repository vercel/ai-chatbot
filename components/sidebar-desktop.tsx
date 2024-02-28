import { Sidebar } from '@/components/sidebar'
import Image from 'next/image'
import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history'

export async function SidebarDesktop() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full bg-[#121212] duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[240px] h-full px-4 pt-4">
      <Image alt="ocada" src="/OCADA.svg" width={102} height={102} />
      <ChatHistory userId={session.user.id} />
    </Sidebar>
  )
}
