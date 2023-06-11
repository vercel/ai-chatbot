import { getChats } from '@/app/actions'
import { Session } from '@auth/core/types'
import { SidebarItem } from './sidebar-item'

export interface SidebarListProps {
  session?: Session
}

export async function SidebarList(props: SidebarListProps) {
  const chats = await getChats(props.session?.user?.email)
  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="px-2 space-y-2">
          {chats.map(chat => (
            <SidebarItem
              key={chat.id}
              title={chat.title}
              userId={props?.session?.user?.email ?? ''}
              href={`/chat/${chat.id}`}
              id={chat.id}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {props?.session?.user ? (
              <>No chat history</>
            ) : (
              <>Login for history</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

SidebarList.displayName = 'SidebarList'
