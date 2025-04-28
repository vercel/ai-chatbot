'use client';

import { useMemo, useState, useCallback } from 'react';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { useUser } from '@clerk/nextjs';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/utils';

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
import { ChatItem } from './sidebar-history-item';
import { LoaderIcon } from './icons';
import { Skeleton } from './ui/skeleton';
import type { DBChat } from '@/lib/db/schema';

// Infer user type from useUser hook return value
type UseUserReturn = ReturnType<typeof useUser>;
type UserPropType = UseUserReturn['user'];

export interface HistoryPage {
  items: DBChat[];
  hasMore: boolean;
}

type GroupedChats = {
  today: DBChat[];
  yesterday: DBChat[];
  lastWeek: DBChat[];
  lastMonth: DBChat[];
  older: DBChat[];
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: DBChat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = chat.createdAt;

      if (!chatDate) {
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

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: HistoryPage | null,
): string | null {
  if (previousPageData && !previousPageData.hasMore) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const lastItem = previousPageData?.items?.at(-1);

  if (!lastItem) return null;

  return `/api/history?ending_before=${lastItem.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: UserPropType }) {
  const { setOpenMobile } = useSidebar();
  const params = useParams();
  const activeChatId = typeof params?.id === 'string' ? params.id : null;
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  console.log('[SidebarHistory] Component Render START');

  const {
    data: paginatedChatHistories,
    error,
    isLoading,
    isValidating,
    setSize,
    mutate,
  } = useSWRInfinite<HistoryPage>(getChatHistoryPaginationKey, fetcher, {
    revalidateFirstPage: false,
    fallbackData: [],
    keepPreviousData: true,
  });

  const isLoadingInitialData = isLoading && !paginatedChatHistories;
  const isLoadingMore =
    isLoading && paginatedChatHistories && paginatedChatHistories.length > 0;

  const allChatStubs: DBChat[] = useMemo(() => {
    return paginatedChatHistories?.flatMap((page) => page.items) ?? [];
  }, [paginatedChatHistories]);

  const hasMoreOlder = paginatedChatHistories?.at(-1)?.hasMore ?? false;

  console.log(
    `[SidebarHistory] SWR State: isLoadingInitial=${isLoadingInitialData}, isLoadingMore=${isLoadingMore}, error=${error}, allChatStubs length=${allChatStubs.length}, hasMoreOlder=${hasMoreOlder}`,
  );

  const groupedChats = useMemo(() => {
    console.log('[SidebarHistory] useMemo for groupedChats START');
    const result = groupChatsByDate(allChatStubs);
    console.log('[SidebarHistory] useMemo for groupedChats END');
    return result;
  }, [allChatStubs]);

  const hasItems = useMemo(() => allChatStubs.length > 0, [allChatStubs]);
  console.log(`[SidebarHistory] Calculated hasItems: ${hasItems}`);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const tempDeleteId = deleteId;
    setShowDeleteDialog(false);
    setDeleteId(null);

    mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((page) => ({
          ...page,
          items: page.items.filter((chat) => chat.id !== tempDeleteId),
        }));
      },
      { revalidate: false },
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
      mutate();
    } catch (err: any) {
      console.error('Failed to delete chat:', err);
      toast.error(`Failed to delete chat: ${err.message || 'Unknown error'}`);
      mutate();
    }
  }, [deleteId, activeChatId, mutate, router]);

  const showSkeleton = isLoadingInitialData;
  const showError = !!error;
  const showEmpty = !isLoadingInitialData && !error && !hasItems;
  const showList = !isLoadingInitialData && !error && hasItems;

  console.log(
    `[SidebarHistory] Rendering Checks: showSkeleton=${showSkeleton}, showError=${showError}, showEmpty=${showEmpty}, showList=${showList}`,
  );

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

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
            Error loading chats: {error?.message || 'Unknown error'}
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
      {showList && (
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
                    {chats.map((chat) => (
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
                    ))}
                  </div>
                );
              })}
            </SidebarMenu>

            <motion.div
              className="h-10 w-full"
              onViewportEnter={() => {
                if (!isValidating && hasMoreOlder) {
                  console.log('[SidebarHistory] Loading more...');
                  setSize((size) => size + 1);
                }
              }}
            />

            {isLoadingMore && (
              <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center justify-center mt-4">
                <div className="animate-spin">
                  <LoaderIcon />
                </div>
                <div>Loading More Chats...</div>
              </div>
            )}

            {!hasMoreOlder && !isLoadingMore && (
              <div className="p-4 text-sm text-muted-foreground text-center mt-4">
                End of chat history.
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
