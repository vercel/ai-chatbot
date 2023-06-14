import { getChats } from '@/app/actions'

import { SidebarItem } from '@/components/sidebar-item'
import { LoginButton } from '@/components/login-button'

export interface SidebarListProps {
  userId?: string
}

export async function SidebarList({ userId }: SidebarListProps) {
  if (!userId) {
    return (
      <div className="flex flex-1 flex-col items-center space-y-4 p-6 text-sm">
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

  const chats = await getChats(userId)

  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-2">
          {chats.map(chat => (
            <SidebarItem
              key={chat.id}
              title={chat.title}
              userId={userId ?? ''}
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
