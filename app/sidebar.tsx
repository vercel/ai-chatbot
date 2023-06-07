import { Chat } from '@/lib/types'
import { type Session } from '@auth/nextjs/types'
import { kv } from '@vercel/kv'
import { Sidebar as SidebarIcon } from 'lucide-react'
import { SidebarItem } from './sidebar-item'

import { auth } from '@/auth'
import { NextChat } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export interface SidebarProps {}

export async function Sidebar({}: SidebarProps) {
  const session = await auth()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="w-9 h-9 p-0">
          <SidebarIcon className="w-6 h-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        position="left"
        className="w-[300px] top-2 rounded-lg left-2 bottom-2 h-auto"
      >
        <div className="flex items-center">
          <NextChat className="mr-2 w-6 h-6 text-primary" inverted />
          <span className="select-none font-bold">Chatbot</span>
        </div>
        {/* @ts-ignore */}
        <SidebarList session={session} />
      </SheetContent>
    </Sheet>
  )
}

async function SidebarList({ session }: { session?: Session }) {
  const results: Chat[] = await getChats(session?.user?.email ?? '')

  return results.map(c => (
    <SidebarItem
      key={c.id}
      title={c.title}
      userId={session?.user?.email ?? ''}
      href={`/chat/${c.id}`}
      id={c.id}
    />
  ))
}

async function getChats(userId: string) {
  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1)

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}
