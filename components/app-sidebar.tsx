'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [openDeleteAllChatsDialog, setOpenDeleteAllChatsDialog] =
    useState(false);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Arcade GPT
              </span>
            </Link>
            <div className="flex flex-row gap-2">
              <Dialog
                open={openDeleteAllChatsDialog}
                onOpenChange={setOpenDeleteAllChatsDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" type="button" className="p-2 h-fit">
                    <Trash2 />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete All Chats</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    This will delete all your chats and messages.
                  </DialogDescription>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpenDeleteAllChatsDialog(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        const deletePromise = fetch('/api/history', {
                          method: 'DELETE',
                        });

                        toast.promise(deletePromise, {
                          loading: 'Deleting all chats...',
                          success: () => {
                            router.push('/');
                            router.refresh();
                            setOpenDeleteAllChatsDialog(false);
                            return 'All chats deleted successfully';
                          },
                          error: 'Failed to delete all chats',
                        });
                      }}
                    >
                      Delete All Chats
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
