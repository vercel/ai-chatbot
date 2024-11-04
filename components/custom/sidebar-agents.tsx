import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { agent, type Agent } from '@/db/schema';
import { PlusIcon, MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';
import { BotIcon, PencilEditIcon } from './icons';
import { useParams } from 'next/navigation';

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
                  {/* <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
                      onSelect={() => onDelete(item.id)}
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent> */}
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
