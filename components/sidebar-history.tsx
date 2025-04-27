'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { ChatStub } from './app-sidebar';
import { ChatItem } from './sidebar-history-item';
import { LoaderIcon } from './icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { useSidebarData } from './app-sidebar';

type FilteredChatItem = ChatStub;

type GroupedChats = {
  today: ChatStub[];
  yesterday: ChatStub[];
  lastWeek: ChatStub[];
  lastMonth: ChatStub[];
  older: ChatStub[];
};

const groupChatsByDate = (chats: ChatStub[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = chat.createdAt;

      if (
        !chatDate ||
        !(chatDate instanceof Date) ||
        Number.isNaN(chatDate.getTime())
      ) {
        console.warn(
          `[SidebarHistory] Invalid or missing createdAt date for chat ${chat.id}`,
        );
        groups.older.push(chat);
      } else if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const params = useParams();
  const activeChatId = typeof params?.id === 'string' ? params.id : null;
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  console.log('[SidebarHistory] Component Render START');

  const {
    allChatStubs,
    initialFetchAttempted,
    error: contextError,
    hasMoreOlder,
    loadMoreOlderItems,
    mutateAllChats,
  } = useSidebarData();
  console.log(
    `[SidebarHistory] Data from context: initialFetchAttempted=${initialFetchAttempted}, contextError=${contextError}, allChatStubs length=${allChatStubs?.length ?? 0}`,
  );

  const groupedChats = useMemo(() => {
    console.log('[SidebarHistory] useMemo for groupedChats START');
    const result = groupChatsByDate(allChatStubs);
    console.log('[SidebarHistory] useMemo for groupedChats END');
    return result;
  }, [allChatStubs]);

  const chatItems = allChatStubs;
  const hasItems = chatItems.length > 0;
  console.log(`[SidebarHistory] Calculated hasItems: ${hasItems}`);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const tempDeleteId = deleteId;
    setShowDeleteDialog(false);
    setDeleteId(null);

    mutateAllChats(
      (currentData: any) => {
        if (!currentData) return currentData;
        return currentData;
      },
      {
        optimisticData: allChatStubs.filter((chat) => chat.id !== tempDeleteId),
        rollbackOnError: true,
        populateCache: false,
        revalidate: false,
      },
    );

    if (tempDeleteId === activeChatId) {
      router.push('/');
    }

    try {
      const response = await fetch(`/api/chat?id=${tempDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to delete chat: ${response.status} ${response.statusText} - ${errorData}`,
        );
      }

      toast.success('Chat deleted successfully');
      mutateAllChats(undefined, { revalidate: true });
    } catch (err: any) {
      console.error('Failed to delete chat:', err);
      toast.error(`Failed to delete chat: ${err.message || 'Unknown error'}`);
      mutateAllChats(undefined, { revalidate: true });
    }
  }, [deleteId, activeChatId, mutateAllChats, router, allChatStubs]);

  // --- Strict Rendering Logic Checks --- //
  // const showSkeleton = !initialFetchAttempted && !hasItems; // Original logic
  const showSkeleton = !initialFetchAttempted; // MODIFIED: Only check if fetch attempt is pending
  const showError = initialFetchAttempted && contextError;
  // Modify showEmpty to account for skeleton being shown even if items exist but fetch isn't attempted
  const showEmpty = initialFetchAttempted && !contextError && !hasItems;
  // const showList = !showSkeleton && !showError && !showEmpty; // Original logic
  const showList = initialFetchAttempted && !contextError && hasItems; // MODIFIED: Show list only if fetch attempted, no error, and items exist

  console.log(
    `[SidebarHistory] Rendering Checks: showSkeleton=${showSkeleton}, showError=${showError}, showEmpty=${showEmpty}, showList=${showList}`,
  );

  if (showSkeleton) {
    console.log('[SidebarHistory] Rendering Skeleton');
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </SidebarGroup>
    );
  }

  if (showError) {
    console.log('[SidebarHistory] Rendering Error');
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <div className="p-4 text-sm text-red-600">
            Error loading chats: {contextError?.message || 'Unknown error'}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (showEmpty) {
    console.log('[SidebarHistory] Rendering Empty State');
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <div className="p-4 text-sm text-muted-foreground">
            No chat history found.
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  console.log('[SidebarHistory] Rendering List');
  return (
    <>
      {hasItems && (
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(groupedChats).map(([groupName, chats]) => {
                if (chats.length === 0) return null;
                const groupNameMap: Record<string, string> = {
                  today: 'Today',
                  yesterday: 'Yesterday',
                  lastWeek: 'Last 7 Days',
                  lastMonth: 'Last 30 Days',
                  older: 'Older',
                };
                const displayGroupName =
                  groupNameMap[groupName] ||
                  groupName.charAt(0).toUpperCase() + groupName.slice(1);

                return (
                  <div key={groupName}>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      {displayGroupName}
                    </div>
                    {chats.map((chat) => {
                      return (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={activeChatId === chat.id}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {hasMoreOlder && (
        <div className="p-4 text-center text-xs text-muted-foreground">
          End of history.
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              chat and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
