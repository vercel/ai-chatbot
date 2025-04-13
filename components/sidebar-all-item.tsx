'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
        ? `/chat/${item.chat_id}?showArtifact=${item.id}`
        : '#';

  const handleNavigate = (e: React.MouseEvent) => {
    const targetHref = href;
    if (item.type === 'document' && !item.chat_id) {
      e.preventDefault();
      toast.error(`Document "${item.title}" is not linked to a chat.`);
      return;
    }

    if (targetHref === '#') {
      e.preventDefault();
    } else {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} onClick={handleNavigate}>
        <Link href={href}>
          <IconComponent className="size-4 mr-0 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>

      {/* TODO: Implement DropdownMenu for actions if needed */}
      {/* <DropdownMenu modal={true}> ... </DropdownMenu> */}
    </SidebarMenuItem>
  );
};

export const SidebarAllItem = memo(PureAllItem);
