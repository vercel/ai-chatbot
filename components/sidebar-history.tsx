"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export type ChatHistory = {
  chats: never[];
  hasMore: boolean;
};

export function getChatHistoryPaginationKey(
  _pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (_pageIndex === 0) {
    return `/api/history?limit=20`;
  }

  return null;
}

// Stateless: Chat history managed client-side (e.g., localStorage)
// This component shows an empty state since we don't persist chats server-side
export function SidebarHistory() {
  // Stateless: Always show empty state since chats aren't persisted
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
          Stateless mode: Your conversations are managed client-side only.
          {/* Future: Add localStorage-based chat history here */}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}