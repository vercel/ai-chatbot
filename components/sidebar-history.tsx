'use client';

// Keep necessary date-fns functions, add isValid
import { isToday, isYesterday, subMonths, subWeeks, isValid } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { useUser } from '@clerk/nextjs'; // Keep Clerk type
import { useState } from 'react'; // Keep useState
import { toast } from 'sonner'; // Keep sonner
import { motion } from 'framer-motion'; // Keep motion
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
import type { DBChat } from '@/lib/db/schema'; // Correct: Import the exported type directly
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from './icons';
// Removed Skeleton import

// Infer user type from useUser hook return value
type UseUserReturn = ReturnType<typeof useUser>;
type UserPropType = UseUserReturn['user'];

// Keep ChatHistory interface using 'items' matching API response
export interface ChatHistory {
  items: Array<DBChat>;
  hasMore: boolean;
}

type GroupedChats = {
  today: DBChat[];
  yesterday: DBChat[];
  lastWeek: DBChat[];
  lastMonth: DBChat[];
  older: DBChat[];
};

// Keep PAGE_SIZE (adjust if needed, 30 was local)
const PAGE_SIZE = 30;

// Keep groupChatsByDate with isValid check
const groupChatsByDate = (chats: DBChat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      // Keep null/undefined chat check
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
      // Keep isValid check
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

// Keep getChatHistoryPaginationKey adapted for 'items'
export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory | null, // Allow null for SWRInfinite
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
  // Keep Clerk UserPropType
  const { setOpenMobile } = useSidebar();
  // const { id } = useParams(); // Use params directly like original if needed, or keep activeChatId
  const params = useParams();
  const activeChatId = typeof params?.id === 'string' ? params.id : null; // Keep activeChatId extraction

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating, // Keep isValidating
    isLoading, // Keep isLoading
    error, // Keep error for potential use
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    // Keep ChatHistory<items> type
    revalidateFirstPage: false, // Keep SWR options
    keepPreviousData: true, // Keep SWR options
    // Remove fallbackData: [] ? Match original
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Calculate hasReachedEnd like original, adapting for pages/hasMore
  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  // Calculate hasEmptyChatHistory like original, adapting for 'items' and ensuring validity
  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => {
        // Add checks for safety
        if (page && Array.isArray(page.items)) {
          return page.items.length === 0;
        }
        // Treat invalid page structure as empty for this check
        return true;
      })
    : false; // Default to false if paginatedChatHistories is undefined

  // Revert handleDelete closer to original using toast.promise
  const handleDelete = async () => {
    if (!deleteId) return;
    const tempDeleteId = deleteId; // Store locally before clearing state
    setShowDeleteDialog(false);
    setDeleteId(null);

    const deletePromise = fetch(`/api/chat?id=${tempDeleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        // Mutate logic adapted for pages and 'items'
        mutate(
          (currentData) => {
            if (currentData) {
              return currentData.map((page) => ({
                ...page,
                items: page.items.filter((chat) => chat.id !== tempDeleteId),
              }));
            }
            return currentData; // Return unchanged if no current data
          },
          { revalidate: false },
        ); // Keep revalidate false for optimistic feel

        // Redirect if the active chat was deleted
        if (tempDeleteId === activeChatId) {
          router.push('/');
          router.refresh(); // Add refresh like original?
        }

        return 'Chat deleted successfully'; // Message for toast
      },
      error: (err) => {
        // Handle error within toast.promise
        console.error('Failed to delete chat:', err); // Add logging
        return err instanceof Error ? err.message : 'Failed to delete chat'; // Error message for toast
      },
    });
  };

  // Keep !user check for Clerk
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

  // Use original isLoading check and skeleton rendering
  if (isLoading && !paginatedChatHistories) {
    // Be more specific: show skeleton only on initial load without any data yet
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        {' '}
        {/* Keep scroll */}
        {/* Use original manual skeleton structure */}
        <div className="p-4 space-y-2">
          <div className="h-6 w-3/4 rounded-md bg-sidebar-accent-foreground/10 animate-pulse" />
          <div className="h-6 w-1/2 rounded-md bg-sidebar-accent-foreground/10 animate-pulse" />
          <div className="h-6 w-2/3 rounded-md bg-sidebar-accent-foreground/10 animate-pulse" />
        </div>
      </SidebarGroup>
    );
  }

  // Use original hasEmptyChatHistory check
  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup className="flex-1 overflow-y-auto">
        {' '}
        {/* Keep scroll */}
        <SidebarGroupContent>
          <div className="p-4 text-sm text-muted-foreground">
            {' '}
            {/* Adjusted text */}
            No chat history found.
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Main render logic (closer to original)
  return (
    <>
      {/* Make top group scrollable */}
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Calculate grouped chats directly here, remove useMemo */}
            {(() => {
              // Adapt flatMap for 'items'
              const chatsFromHistory =
                paginatedChatHistories?.flatMap(
                  (page) => page.items ?? [], // Add nullish coalescing for safety
                ) ?? []; // Add nullish coalescing for safety

              const groupedChats = groupChatsByDate(chatsFromHistory);

              return (
                // Use original rendering structure
                <div className="flex flex-col gap-6">
                  {groupedChats.today.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Today
                      </div>
                      {groupedChats.today.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                  {groupedChats.yesterday.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Yesterday
                      </div>
                      {groupedChats.yesterday.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                  {groupedChats.lastWeek.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Last 7 days
                      </div>
                      {groupedChats.lastWeek.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                  {groupedChats.lastMonth.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Last 30 days
                      </div>
                      {groupedChats.lastMonth.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                  {groupedChats.older.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Older
                      </div>
                      {groupedChats.older.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === activeChatId}
                          onDelete={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </SidebarMenu>

          {/* Keep motion div for loading more */}
          <motion.div
            className="h-10 w-full" // Keep size
            onViewportEnter={() => {
              // Use original logic check
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {/* Use original loading/end messages */}
          {hasReachedEnd ? (
            <div className="p-4 text-sm text-muted-foreground text-center mt-4">
              {' '}
              {/* Adjusted styling */}
              End of chat history.
            </div>
          ) : (
            // Show loading indicator only if validating and not initial load
            isValidating &&
            paginatedChatHistories &&
            paginatedChatHistories.length > 0 && (
              <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center justify-center mt-4">
                {' '}
                {/* Keep styling */}
                <div className="animate-spin">
                  <LoaderIcon />
                </div>
                <div>Loading More Chats...</div>
              </div>
            )
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Keep AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from all servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* Use reverted handleDelete */}
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
