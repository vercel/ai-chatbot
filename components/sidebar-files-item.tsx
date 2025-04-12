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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreHorizontalIcon, ShareIcon, TrashIcon } from './icons';
import { useSidebar } from './ui/sidebar'; // To close mobile sidebar on click
import { useRouter } from 'next/navigation'; // To navigate
import { createClient } from '@/lib/supabase/client'; // To find chat ID
import { toast } from 'sonner'; // Correct import for toast

interface DocumentItem {
  id: string;
  title: string;
  modifiedAt: string;
  chat_id: string | null;
}

interface SidebarFilesItemProps {
  document: DocumentItem;
  isActive: boolean; // Placeholder for now, logic TBD
  onDelete: (documentId: string) => void;
}

const PureFilesItem = ({
  document,
  isActive,
  onDelete,
}: SidebarFilesItemProps) => {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const [isFindingChat, setIsFindingChat] = useState(false);

  // Function to find chat ID based on document title and navigate
  const handleNavigate = async () => {
    setIsFindingChat(true); // Keep loading indicator

    if (document.chat_id) {
      // Preferred path: Use the direct chat_id
      console.log(
        `Navigating using direct chat_id: ${document.chat_id} for document ${document.id}`,
      );
      setOpenMobile(false);
      router.push(`/chat/${document.chat_id}?showArtifact=${document.id}`);
      setIsFindingChat(false); // Navigation initiated
      return; // Exit early
    } else {
      // Fallback / Error path: No chat_id stored for this document
      console.warn(
        `Document "${document.title}" (ID: ${document.id}) has no associated chat_id.`,
      );
      toast.error(`This document is not linked to a specific chat thread.`);
      setIsFindingChat(false); // Stop loading
      return; // Do not navigate
    }
  };

  // Placeholder share function
  const handleShare = () => {
    // TODO: Implement document sharing logic if needed
    console.log('Share document:', document.id);
    // Example: copy share link to clipboard?
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild // Use asChild to allow the Link to handle navigation
        isActive={isActive}
        disabled={isFindingChat} // Disable button while finding chat
        onClick={(e) => {
          // Prevent default Link behavior if we are handling click manually
          e.preventDefault();
          handleNavigate();
        }}
      >
        {/* Use a placeholder href, actual navigation happens in handleNavigate */}
        <Link href="#">
          <span className="truncate max-w-[180px]">{document.title}</span>
          {isFindingChat && <span className="ml-2">...</span>}
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          {/* Share Option (Placeholder) */}
          <DropdownMenuItem className="cursor-pointer" onSelect={handleShare}>
            <ShareIcon />
            <span>Share</span>
          </DropdownMenuItem>

          {/* Delete Option */}
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(document.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const SidebarFilesItem = memo(PureFilesItem); // Use memo for performance
