import { PlusIcon, MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { deleteAgentAction } from '@/app/(chat)/agent/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type Agent } from '@/db/schema';

import { BotIcon, PencilEditIcon, TrashIcon } from './icons';

export function SidebarAgents({ agents }: { agents: Agent[] }) {
  const { id } = useParams();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Agents</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {agents.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/agent/${item.id}`}>
                    <BotIcon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu modal={true}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
                      showOnHover={!(id === item.id)}
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/agent/${item.id}/edit`}>
                        <PencilEditIcon />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
                      onSelect={() => deleteAgentAction(item.userId, item.id)}
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem key="new-agent">
              <SidebarMenuButton asChild>
                <Link href="/agent/new">
                  <PlusIcon />
                  <span>New Agent</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
