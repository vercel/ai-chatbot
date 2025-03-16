'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { memo, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { TrashIcon } from '@/components/icons';
import { IconWrapper } from './ui/icon-wrapper';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useSidebar } from '@/components/ui/sidebar';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-cornsilk-500/70">
        Login to save and revisit previous chats
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="date-header">Today</div>
        {[44, 32, 28].map((width, i) => (
          <div
            key={i}
            className="bg-hunter_green-600/50 h-8 my-1 rounded animate-pulse"
            style={{ width: `${width}%` }}
          ></div>
        ))}
      </div>
    );
  }

  if (history?.length === 0) {
    return (
      <div className="p-4 text-center text-cornsilk-500/70">
        Your conversations will appear here once you start chatting!
      </div>
    );
  }

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
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

  return (
    <div className="overflow-y-auto h-[calc(100vh-60px)]">
      {history &&
        (() => {
          const groupedChats = groupChatsByDate(history);

          return (
            <div className="pb-4">
              {groupedChats.today.length > 0 && (
                <>
                  <div className="date-header">
                    Today
                  </div>
                  {groupedChats.today.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="relative group"
                    >
                      <div 
                        className={`thread-title cursor-pointer ${chat.id === id ? 'bg-hunter_green-600' : ''}`}
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setOpenMobile(false);
                        }}
                      >
                        <span className="block truncate pr-7">{chat.title}</span>
                      </div>
                      <div 
                        className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon size={16} className="size-4 text-cornsilk-400 hover:text-cornsilk-300 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedChats.yesterday.length > 0 && (
                <>
                  <div className="date-header mt-2">
                    Yesterday
                  </div>
                  {groupedChats.yesterday.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="relative group"
                    >
                      <div 
                        className={`thread-title cursor-pointer ${chat.id === id ? 'bg-hunter_green-600' : ''}`}
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setOpenMobile(false);
                        }}
                      >
                        <span className="block truncate pr-7">{chat.title}</span>
                      </div>
                      <div 
                        className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon size={16} className="size-4 text-cornsilk-400 hover:text-cornsilk-300 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedChats.lastWeek.length > 0 && (
                <>
                  <div className="date-header mt-2">
                    Last 7 days
                  </div>
                  {groupedChats.lastWeek.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="relative group"
                    >
                      <div 
                        className={`thread-title cursor-pointer ${chat.id === id ? 'bg-hunter_green-600' : ''}`}
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setOpenMobile(false);
                        }}
                      >
                        <span className="block truncate pr-7">{chat.title}</span>
                      </div>
                      <div 
                        className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon size={16} className="size-4 text-cornsilk-400 hover:text-cornsilk-300 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedChats.lastMonth.length > 0 && (
                <>
                  <div className="date-header mt-2">
                    Last 30 days
                  </div>
                  {groupedChats.lastMonth.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="relative group"
                    >
                      <div 
                        className={`thread-title cursor-pointer ${chat.id === id ? 'bg-hunter_green-600' : ''}`}
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setOpenMobile(false);
                        }}
                      >
                        <span className="block truncate pr-7">{chat.title}</span>
                      </div>
                      <div 
                        className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon size={16} className="size-4 text-cornsilk-400 hover:text-cornsilk-300 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedChats.older.length > 0 && (
                <>
                  <div className="date-header mt-2">
                    Older
                  </div>
                  {groupedChats.older.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="relative group"
                    >
                      <div 
                        className={`thread-title cursor-pointer ${chat.id === id ? 'bg-hunter_green-600' : ''}`}
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setOpenMobile(false);
                        }}
                      >
                        <span className="block truncate pr-7">{chat.title}</span>
                      </div>
                      <div 
                        className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon size={16} className="size-4 text-cornsilk-400 hover:text-cornsilk-300 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })()}

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
    </div>
  );
}
