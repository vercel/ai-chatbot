'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import {
  DropdownMenu,
  // ... other dropdown imports if needed for delete/share ...
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  MessageIcon, // From icons.tsx
  FileIcon, // From icons.tsx
  MoreHorizontalIcon,
  // ... other icons for actions ...
} from './icons';
import { useSidebar } from './ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Re-use combined type
interface ChatItemData {
  id: string;
  title: string;
  createdAt: string;
  type: 'chat';
}
interface DocumentItemData {
  id: string;
  title: string;
  modifiedAt: string;
  chat_id: string | null;
  type: 'document';
}
type CombinedItem = ChatItemData | DocumentItemData;

interface SidebarAllItemProps {
  item: CombinedItem;
  isActive: boolean;
  // TODO: Add onDelete/onShare props if actions are needed
}

const PureAllItem = ({ item, isActive }: SidebarAllItemProps) => {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();

  const IconComponent = item.type === 'chat' ? MessageIcon : FileIcon;
  const href =
    item.type === 'chat'
      ? `/chat/${item.id}`
      : item.chat_id
        ? `/chat/${item.chat_id}`
        : '#'; // Link to chat directly

  const handleNavigate = (e: React.MouseEvent) => {
    if (item.type === 'document' && !item.chat_id) {
      e.preventDefault(); // Prevent link click if no chat_id
      toast.error(`Document "${item.title}" is not linked to a chat.`);
      return;
    }
    setOpenMobile(false); // Close mobile sidebar on any valid click
    // Navigation is handled by the Link component's href
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} onClick={handleNavigate}>
        <Link href={href}>
          <IconComponent className="size-4 mr-2 shrink-0" aria-hidden="true" />{' '}
          {/* Add Icon */}
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>

      {/* TODO: Implement DropdownMenu for actions if needed */}
      {/* <DropdownMenu modal={true}> ... </DropdownMenu> */}
    </SidebarMenuItem>
  );
};

export const SidebarAllItem = memo(PureAllItem);
