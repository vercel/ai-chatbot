import { getChats } from '@/app/actions'
import { Session } from '@auth/core/types'

import { SidebarItem } from '@/components/sidebar-item'
import { LoginButton } from '@/components/login-button'

export interface SidebarListProps {
  session?: Session
}

export async function SidebarList({ session }: SidebarListProps) {
  if (!session?.user?.email) {
    return (
      <div className="flex-1 p-6 flex text-sm items-center flex-col space-y-4">
        <div className="space-y-1 text-center">
          <p className="font-medium">You are not logged in!</p>
          <p className="text-muted-foreground">
            Please login for chat history.
          </p>
        </div>
        <LoginButton />
      </div>
    )
  }

  const chats = await getChats(session.user.email)

  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="px-2 space-y-2">
          {chats.map(chat => (
            <SidebarItem
              key={chat.id}
              title={chat.title}
              userId={session?.user?.email ?? ''}
              href={`/chat/${chat.id}`}
              id={chat.id}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  )
}

SidebarList.displayName = 'SidebarList'
