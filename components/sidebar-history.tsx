'use client';

import { isToday, isYesterday, subMonths, subWeeks, format } from 'date-fns';
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
import { MessageSquare, MoreVertical, Trash2 } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-cornsilk-500/70">
        <MessageSquare className="h-6 w-6 mb-2 opacity-50" />
        <p>Login to save and revisit previous chats</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="text-xs text-cornsilk-500/70 font-medium mb-2 px-1">Today</div>
        {[44, 32, 28].map((width, i) => (
          <div
            key={i}
            className="bg-white/10 h-8 my-1 rounded animate-pulse"
            style={{ width: `${width}%` }}
          ></div>
        ))}
      </div>
    );
  }

  if (history?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-cornsilk-500/70">
        <MessageSquare className="h-6 w-6 mb-2 opacity-50" />
        <p>Your conversations will appear here</p>
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

  const renderChatItem = (chat: Chat) => (
    <div 
      key={chat.id} 
      className="group relative"
    >
      <div 
        className={`flex items-center rounded-md py-2 px-3 text-sm cursor-pointer transition-colors ${
          chat.id === id 
            ? 'bg-[#FEFAE1] text-[#2A5B34] font-semibold' 
            : 'text-cornsilk-500 hover:bg-white/10'
        }`}
        onClick={() => {
          router.push(`/chat/${chat.id}`);
          setOpenMobile(false);
        }}
      >
        <MessageSquare className={`h-4 w-4 mr-2 flex-shrink-0 ${chat.id === id ? 'text-[#2A5B34]' : 'text-cornsilk-500'}`} />
        <span className={`truncate flex-1 text-sm ${chat.id === id ? 'text-[#2A5B34]' : 'text-cornsilk-500'}`}>{chat.title}</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-sm hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-cornsilk-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(chat.id);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-2 p-1 pb-4">
      {history &&
        (() => {
          const groupedChats = groupChatsByDate(history);

          return (
            <>
              {groupedChats.today.length > 0 && (
                <div>
                  <h3 className="text-xs text-cornsilk-500/70 font-medium mb-1 px-3">
                    Today
                  </h3>
                  <div className="space-y-1">
                    {groupedChats.today.map(renderChatItem)}
                  </div>
                </div>
              )}

              {groupedChats.yesterday.length > 0 && (
                <div>
                  <h3 className="text-xs text-cornsilk-500/70 font-medium mb-1 px-3 mt-3">
                    Yesterday
                  </h3>
                  <div className="space-y-1">
                    {groupedChats.yesterday.map(renderChatItem)}
                  </div>
                </div>
              )}

              {groupedChats.lastWeek.length > 0 && (
                <div>
                  <h3 className="text-xs text-cornsilk-500/70 font-medium mb-1 px-3 mt-3">
                    Previous 7 days
                  </h3>
                  <div className="space-y-1">
                    {groupedChats.lastWeek.map(renderChatItem)}
                  </div>
                </div>
              )}

              {groupedChats.lastMonth.length > 0 && (
                <div>
                  <h3 className="text-xs text-cornsilk-500/70 font-medium mb-1 px-3 mt-3">
                    Previous 30 days
                  </h3>
                  <div className="space-y-1">
                    {groupedChats.lastMonth.map(renderChatItem)}
                  </div>
                </div>
              )}

              {groupedChats.older.length > 0 && (
                <div>
                  <h3 className="text-xs text-cornsilk-500/70 font-medium mb-1 px-3 mt-3">
                    Older
                  </h3>
                  <div className="space-y-1">
                    {groupedChats.older.map(renderChatItem)}
                  </div>
                </div>
              )}
            </>
          );
        })()}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete this chat from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
