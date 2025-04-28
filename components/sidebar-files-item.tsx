'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreHorizontalIcon, ShareIcon, TrashIcon, FileIcon } from './icons';
import { useRouter } from 'next/navigation'; // To navigate
import { toast } from 'sonner'; // Correct import for toast

// UPDATED Interface to match API response
interface DocumentItem {
  id: string;
  title: string;
  modifiedAt: string;
  // chat_id: string | null; // OLD
  chatId: string | null; // NEW
  createdAt: string;
  // Should match the type used in SidebarFiles.tsx and returned by API
  type?: 'document'; // Optional type field
}

interface SidebarFilesItemProps {
  document: DocumentItem;
  isActive: boolean;
  onDelete: (documentId: string) => void;
}

const PureFilesItem = ({
  document,
  isActive,
  onDelete,
}: SidebarFilesItemProps) => {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  // REMOVED: const [isFindingChat, setIsFindingChat] = useState(false);

  // UPDATED: Simplified navigation using document.chatId
  const handleNavigate = () => {
    // setIsFindingChat(true); // No longer needed? Navigation is sync

    // if (document.chat_id) { // OLD
    if (document.chatId) {
      // NEW
      // Preferred path: Use the direct chatId
      console.log(
        // `Navigating using direct chat_id: ${document.chat_id} for document ${document.id}`,
        `Navigating using direct chatId: ${document.chatId} for document ${document.id}`,
      );
      setOpenMobile(false);
      // router.push(`/chat/${document.chat_id}?showArtifact=${document.id}`); // OLD
      router.push(`/chat/${document.chatId}?showArtifact=${document.id}`); // NEW
      // setIsFindingChat(false); // No longer needed
      return; // Exit early
    } else {
      // Fallback / Error path: No chatId stored for this document
      console.warn(
        // `Document "${document.title}" (ID: ${document.id}) has no associated chat_id.`,
        `Document "${document.title}" (ID: ${document.id}) has no associated chatId.`,
      );
      toast.error(`This document is not linked to a specific chat thread.`);
      // setIsFindingChat(false); // No longer needed
      return; // Do not navigate
    }
  };

  // Placeholder share function
  const handleShare = () => {
    // TODO: Implement document sharing logic if needed
    console.log('Share document:', document.id);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        // REMOVED: disabled={isFindingChat}
        onClick={(e) => {
          e.preventDefault();
          handleNavigate();
        }}
      >
        <Link href="#">
          <FileIcon className="size-4 mr-2 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[180px]">{document.title}</span>
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
