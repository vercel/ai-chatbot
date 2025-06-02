'use client';

import type { User } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { SidebarSetupProgress } from '@/components/sidebar-setup-progress';
import { SidebarSearchInput } from '@/components/sidebar-search-input';

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
import { SidebarToggle } from './sidebar-toggle';
import { useState } from 'react';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, state } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          {state === 'expanded' && (
            <>
              <div className="flex flex-row justify-between items-center">
                <Link
                  href="/"
                  onClick={() => setOpenMobile(false)}
                  className="flex flex-row gap-1 items-center pl-4"
                >
                  <img
                    src="/images/circle.png"
                    alt="Logo"
                    className="w-5 h-5"
                  />
                  <span className="text-lg font-semibold text-black hover:bg-muted rounded-md cursor-pointer">
                    DentaMind AI
                  </span>
                </Link>
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
              <SidebarSetupProgress />
              <SidebarSearchInput
                query={searchQuery}
                setQuery={setSearchQuery}
                onSearch={(q) => setSearchQuery(q)}
              />
            </>
          )}
          {state === 'collapsed' && (
            <div className="flex flex-col gap-2  w-full">
              <SidebarSetupProgress minimal />
              <SidebarToggle />
            </div>
          )}
        </SidebarMenu>
      </SidebarHeader>
      {state === 'expanded' && (
        <>
          <SidebarContent>
            <SidebarHistory user={user} searchQuery={searchQuery} />
          </SidebarContent>
          <SidebarFooter>
            {user && <SidebarUserNav user={user} />}
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
