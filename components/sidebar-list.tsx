"use client"

import { useQuery } from "@tanstack/react-query"

import { getChats, removeChat, shareChat } from '@/app/actions'
import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'
import { Chat } from "@/lib/types"

export interface SidebarListProps {
  userId?: string
}

export function SidebarList({ userId }: SidebarListProps) {
  const { data: chats, error, isError, isFetching } = useQuery({
    queryKey: ["stream-initial-chats"],
    queryFn: () => getChats(userId),
  })

  return (
    <div className="flex-1 overflow-auto">
      {isFetching ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading chats...</p>
        </div>
      ) : (
        isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Error fetching chats: {error.message || 'An error occurred'}</p>
          </div>
        ) : (
          chats?.length ? (
            <div className="space-y-2 px-2">
              {chats.map(
                (chat: Chat) =>
                  chat && (
                    <SidebarItem key={chat?.id} chat={chat}>
                      <SidebarActions
                        chat={chat}
                        removeChat={removeChat}
                        shareChat={shareChat}
                      />
                    </SidebarItem>
                  )
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No chat history</p>
            </div>
          )
        )
      )}
    </div>
  )
}
