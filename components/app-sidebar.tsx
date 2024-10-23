'use client';
import { ChevronUp, PencilIcon, PencilLineIcon, User2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { type User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Chat } from '@/db/schema';
import { cn, fetcher, getTitleFromChat } from '@/lib/utils';

import {
  InfoIcon,
  MessageIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from './custom/icons';
import { ThemeToggle } from './custom/theme-toggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  BetterTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const { id } = useParams();
  const pathname = usePathname();
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
  const router = useRouter();
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

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="text-base font-semibold dark:text-zinc-300 tracking-tight flex flex-row items-center gap-2 justify-between">
            <BetterTooltip content="Close Sidebar" align="start">
              <SidebarTrigger />
            </BetterTooltip>
            <BetterTooltip content="New Chat" align="start">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <PencilLineIcon />
                  <span className="sr-only">New Chat</span>
                </Link>
              </Button>
            </BetterTooltip>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            {!user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>Login to save and revisit previous chats!</div>
              </div>
            ) : null}

            {!isLoading && history?.length === 0 && user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>No chats found</div>
              </div>
            ) : null}

            {isLoading && user ? (
              <div className="flex flex-col">
                {[44, 32, 28, 52].map((item) => (
                  <div key={item} className="p-2 my-[2px]">
                    <div
                      className={`w-${item} h-[20px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                    />
                  </div>
                ))}
              </div>
            ) : null}
            <SidebarMenu>
              {history &&
                history.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild>
                      <Link href={`/chat/${chat.id}`}>
                        <span>{getTitleFromChat(chat)}</span>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu modal={true}>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <MoreHorizontalIcon />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" className="z-[60]">
                        <DropdownMenuItem asChild>
                          <Button
                            className="flex flex-row gap-2 items-center justify-start w-full h-fit font-normal p-1.5 rounded-sm"
                            variant="ghost"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <TrashIcon />
                            <div>Delete</div>
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> {user?.email}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      className="w-full "
                      onClick={() => {
                        signOut({
                          redirectTo: '/',
                        });
                      }}
                    >
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

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
