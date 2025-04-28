'use client';

import { useMemo, useState, useCallback } from 'react';
import { isToday, isYesterday, subMonths, subWeeks, isValid } from 'date-fns';
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

// FIX: Update ChatHistory interface to use 'items' matching API response
export interface ChatHistory {
  items: Array<DBChat>; // Use 'items' instead of 'chats'
  hasMore: boolean;
}

type GroupedChats = {
  today: DBChat[];
  yesterday: DBChat[];
  lastWeek: DBChat[];
  lastMonth: DBChat[];
  older: DBChat[];
};

const PAGE_SIZE = 30;

const groupChatsByDate = (chats: DBChat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      if (!chat || !chat.createdAt) {
        console.warn(
          '[SidebarHistory] Encountered chat without createdAt:',
          chat,
        );
        groups.older.push(
          chat || {
            id: `invalid-${Math.random()}`,
            title: 'Invalid Chat Data',
            createdAt: new Date(0),
          },
        );
        return groups;
      }

      const chatDate = new Date(chat.createdAt);

      if (!isValid(chatDate)) {
        console.warn(
          '[SidebarHistory] Encountered chat with invalid createdAt date:',
          chat,
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

export function getChatHistoryPaginationKey(
  pageIndex: number,
  // Use ChatHistory type
  previousPageData: ChatHistory | null, // Allow null for SWRInfinite
): string | null {
  // FIX: Use previousPageData.items
  if (previousPageData && !previousPageData.hasMore) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  // FIX: Use previousPageData.items
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
    // Use ChatHistory type in SWRInfinite hook
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    revalidateFirstPage: false,
    keepPreviousData: true,
  });

  const isLoadingInitialData = isLoading;
  const isLoadingMore =
    isValidating && paginatedChatHistories && paginatedChatHistories.length > 0;

  const hasMoreOlder = paginatedChatHistories?.at(-1)?.hasMore ?? false;

  console.log(
    `[SidebarHistory] SWR State: isLoadingInitial=${isLoadingInitialData}, isLoadingMore=${isLoadingMore}, error=${error}, pages=${paginatedChatHistories?.length}, hasMoreOlder=${hasMoreOlder}`,
  );

  const groupedChats = useMemo(() => {
    console.log('[SidebarHistory] useMemo for groupedChats START');
    // FIX: Use flatMap((page) => page.items)
    const currentChats =
      paginatedChatHistories?.flatMap((page) => page.items) ?? [];
    const result = groupChatsByDate(currentChats);
    console.log('[SidebarHistory] useMemo for groupedChats END');
    return result;
  }, [paginatedChatHistories]);

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

  // Calculate hasReachedEnd (equivalent to Vercel original)
  const hasReachedEnd = !hasMoreOlder;

  // Refined Check: Only consider empty if loading is finished AND data is present AND it's truly empty
  const hasEmptyChatHistory =
    !isLoading && // Add check: ensure initial load is complete
    paginatedChatHistories && // Add check: ensure data array exists
    paginatedChatHistories.every((page) => {
      // FIX: Explicitly check if page and page.items exist and is an array
      if (page && Array.isArray(page.items)) {
        return page.items.length === 0; // FIX: Check page.items.length
      }
      // Treat missing/invalid page or page.items as effectively empty
      return true;
    });

  const showError = !!error;

  console.log(
    // Keep logging for now, but adjust to reflect simplified state checks
    `[SidebarHistory] Rendering Checks: isLoading=${isLoading}, error=${error}, hasEmpty=${hasEmptyChatHistory}, hasReachedEnd=${hasReachedEnd}`,
  );

  // --- Use Vercel Original Loading/Empty State Rendering ---
  console.log(
    `[SidebarHistory] Decision State: isLoading=${isLoading}, showError=${showError}, hasEmpty=${hasEmptyChatHistory}, pages=${JSON.stringify(paginatedChatHistories)}`,
  );

  if (isLoading) {
    // Use the original Vercel skeleton rendering logic
    console.log('[SidebarHistory] Rendering Skeleton (Vercel Style)');
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        {/* Simplified skeleton, adjust if needed */}
        <div className="p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </SidebarGroup>
    );
  }

  if (showError) {
    // Keep explicit error handling
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

  if (hasEmptyChatHistory) {
    console.log('[SidebarHistory] Rendering Empty State (Vercel Style)');
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
  // --- End Revert ---

  // Render list if not loading, no error, and not empty
  console.log('[SidebarHistory] Rendering List');
  return (
    <>
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
              // Use hasReachedEnd (which is !hasMoreOlder)
              if (!isValidating && !hasReachedEnd) {
                console.log('[SidebarHistory] Loading more...');
                setSize((size) => size + 1);
              }
            }}
          />

          {/* --- Revert Bottom Indicator Logic to Vercel Original Pattern --- */}
          {hasReachedEnd ? (
            <div className="p-4 text-sm text-muted-foreground text-center mt-4">
              End of chat history.
            </div>
          ) : (
            // Show loading indicator if not at the end
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center justify-center mt-4">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading More Chats...</div>
            </div>
          )}
          {/* --- End Revert --- */}
        </SidebarGroupContent>
      </SidebarGroup>

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
