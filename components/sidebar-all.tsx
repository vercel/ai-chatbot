'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton'; // Use skeleton for loading
import { SidebarAllItem } from './sidebar-all-item'; // Import the new item component

// Interfaces for fetched data
interface ChatItemData {
  id: string;
  title: string;
  createdAt: string; // Use createdAt for sorting chats
  type: 'chat';
}

interface DocumentItemData {
  id: string;
  title: string;
  modifiedAt: string; // Use modifiedAt for sorting documents
  chat_id: string | null; // Needed for navigation
  type: 'document';
}

type CombinedItem = ChatItemData | DocumentItemData;

interface SidebarAllProps {
  user: User | undefined;
}

// --- Add grouped items type ---
type GroupedItems = {
  today: CombinedItem[];
  yesterday: CombinedItem[];
  lastWeek: CombinedItem[];
  lastMonth: CombinedItem[];
  older: CombinedItem[];
};
// --- End Add ---

// --- Add grouping function ---
const groupItemsByDate = (items: CombinedItem[]): GroupedItems => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  // Sort items first (newest first)
  items.sort((a, b) => {
    const dateA = new Date(a.type === 'chat' ? a.createdAt : a.modifiedAt);
    const dateB = new Date(b.type === 'chat' ? b.createdAt : b.modifiedAt);
    return dateB.getTime() - dateA.getTime(); // Descending order
  });

  return items.reduce(
    (groups, item) => {
      const itemDateStr =
        item.type === 'chat' ? item.createdAt : item.modifiedAt;
      const itemDate = itemDateStr ? new Date(itemDateStr) : new Date(0);

      if (Number.isNaN(itemDate.getTime())) {
        console.warn(`Invalid date for item ${item.id} (${item.type})`);
        groups.older.push(item);
      } else if (isToday(itemDate)) {
        groups.today.push(item);
      } else if (isYesterday(itemDate)) {
        groups.yesterday.push(item);
      } else if (itemDate > oneWeekAgo) {
        groups.lastWeek.push(item);
      } else if (itemDate > oneMonthAgo) {
        groups.lastMonth.push(item);
      } else {
        groups.older.push(item);
      }
      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedItems,
  );
};
// --- End Add ---

export function SidebarAll({ user }: SidebarAllProps) {
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { id: activeChatId } = useParams(); // For isActive check
  // TODO: Add state/logic for deletion dialog if needed in this combined view

  useEffect(() => {
    if (!user) {
      setCombinedItems([]);
      return;
    }

    const fetchAllItems = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const userId = user.id;

      try {
        // Fetch chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('Chat')
          .select('id, title, createdAt')
          .eq('userId', userId)
          .order('createdAt', { ascending: false }); // Initial sort helps if needed elsewhere

        if (chatsError) throw chatsError;

        const chats: ChatItemData[] = (chatsData || []).map((c) => ({
          ...c,
          type: 'chat',
        }));

        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('Document')
          .select('id, title, modifiedAt, chat_id')
          .eq('userId', userId)
          .order('modifiedAt', { ascending: false }); // Initial sort

        if (documentsError) throw documentsError;

        const documents: DocumentItemData[] = (documentsData || []).map(
          (d) => ({ ...d, type: 'document' }),
        );

        // Combine and set state
        setCombinedItems([...chats, ...documents]);
      } catch (error: any) {
        console.error('Error fetching combined items:', error);
        toast.error(`Failed to load items: ${error.message}`);
        setCombinedItems([]); // Clear on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllItems();
  }, [user]);

  if (!user) return null;

  const groupedItems = groupItemsByDate(combinedItems);
  const hasItems = combinedItems.length > 0;

  // Function to determine if an item is active
  const getIsActive = (item: CombinedItem) => {
    if (!activeChatId) return false;
    if (item.type === 'chat') {
      return item.id === activeChatId;
    }
    // For documents, check if their linked chat_id matches the active chat ID
    if (item.type === 'document') {
      return item.chat_id === activeChatId;
    }
    return false;
  };

  return (
    <>
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading && (
              // Simple loading state
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {!isLoading && !hasItems && (
              <div className="p-4 text-sm text-muted-foreground">
                No chats or documents found.
              </div>
            )}
            {!isLoading && hasItems && (
              <div className="flex flex-col gap-2 pb-2">
                {/* --- Render grouped items --- */}
                {Object.entries(groupedItems).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  // Simple group name mapping for display
                  const displayGroupName =
                    groupName.charAt(0).toUpperCase() +
                    groupName
                      .slice(1)
                      .replace('lastWeek', 'Previous 7 Days')
                      .replace('lastMonth', 'Previous 30 Days');

                  return (
                    <div key={groupName}>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        {displayGroupName}
                      </div>
                      {items.map((item) => (
                        <SidebarAllItem
                          key={`${item.type}-${item.id}`}
                          item={item}
                          isActive={getIsActive(item)}
                          // TODO: Pass delete/share handlers if actions are added
                        />
                      ))}
                    </div>
                  );
                })}
                {/* --- End Render --- */}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {/* TODO: Add AlertDialog if deletion is implemented here */}
    </>
  );
}
