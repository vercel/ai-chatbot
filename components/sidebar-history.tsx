'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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
import type { DBChat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from './icons';

type GroupedChats = {
  today: DBChat[];
  yesterday: DBChat[];
  lastWeek: DBChat[];
  lastMonth: DBChat[];
  older: DBChat[];
};

export interface ChatHistory {
  items: Array<DBChat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: DBChat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
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
  isSignedIn: boolean,
  pageIndex: number,
  previousPageData: ChatHistory | null,
): string | null {
  if (!isSignedIn) {
    return null;
  }

  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const lastChatId = previousPageData?.items?.at(-1)?.id;

  if (!lastChatId) return null;

  return `/api/history?ending_before=${lastChatId}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const { id: activeChatId } = useParams();
  const { isSignedIn, user: clerkUser } = useUser();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // --- State for direct fetch ---
  const [historyData, setHistoryData] = useState<ChatHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<Error | null>(null);

  console.log('[SidebarHistory] Rendering - isSignedIn:', isSignedIn);

  // --- Direct Fetch Logic ---
  useEffect(() => {
    if (isSignedIn) {
      console.log(
        '[SidebarHistory] useEffect: Attempting direct fetch for /api/history',
      );
      setIsLoadingHistory(true);
      setHistoryError(null);
      fetcher(`/api/history?limit=${PAGE_SIZE}`)
        .then((data) => {
          console.log('[SidebarHistory] Direct fetch SUCCESS', data);
          setHistoryData(data);
        })
        .catch((error) => {
          console.error('[SidebarHistory] Direct fetch FAILED', error);
          setHistoryError(error);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      console.log('[SidebarHistory] useEffect: Not signed in, skipping fetch.');
      // Clear data if user logs out
      setHistoryData(null);
      setHistoryError(null);
    }
  }, [isSignedIn]); // Re-run fetch if isSignedIn changes

  /* --- Comment out SWR --- 
  const swrKey = (pageIndex: number, previousPageData: ChatHistory | null) => {
    const key = getChatHistoryPaginationKey(
      isSignedIn ?? false,
      pageIndex,
      previousPageData,
    );
    console.log('[SidebarHistory] SWR Key Function Called - Index:', pageIndex, 'Key:', key);
    return key;
  }

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    swrKey, 
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  );
  --- */

  // --- Use state from direct fetch ---
  const isLoading = isLoadingHistory; // Use direct fetch loading state
  const allChats = historyData?.items ?? [];
  const hasEmptyChatHistory = !isLoading && allChats.length === 0;
  const hasReachedEnd = historyData ? !historyData.hasMore : false;

  const handleDelete = async () => {
    // TODO: Update mutate logic if keeping direct fetch
    // For now, just perform delete
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        // mutate((chatHistories) => {
        //   if (chatHistories) {
        //     return chatHistories.map((chatHistory) => ({
        //       ...chatHistory,
        //       chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
        //     }));
        //   }
        // });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === activeChatId) {
      router.push('/');
    }
  };

  if (!isSignedIn) {
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

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (historyError) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-red-500 w-full flex flex-col justify-center items-center text-sm gap-2">
            <span>Error loading chat history.</span>
            <span className="text-xs text-red-600">{historyError.message}</span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedChats = groupChatsByDate(allChats);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
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
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
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
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
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
                    Last 7 Days
                  </div>
                  {groupedChats.lastWeek.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
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
                    Last 30 Days
                  </div>
                  {groupedChats.lastMonth.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
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
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>

          {/* --- Remove SWR infinite scroll trigger --- 
          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                // setSize((size) => size + 1); // SWR specific
              }
            }}
          />
          --- */}

          {/* --- Adjust end/loading message based on direct fetch --- */}
          {hasReachedEnd ? (
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
              End of chat history.
            </div>
          ) : (
            !isLoading && (
              <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
                {/* Maybe show a button to load more if pagination is added later */}
              </div>
            )
          )}
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
