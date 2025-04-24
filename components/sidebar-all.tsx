'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { SidebarAllItem } from './sidebar-all-item';
import { fetcher } from '@/lib/utils';

// Interfaces matching the API response for /api/history?type=all
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
  chatId: string | null;
  type: 'document';
  createdAt: string;
}

type CombinedItem = ChatItemData | DocumentItemData;

// API Response structure
interface AllItemsApiResponse {
  items: CombinedItem[];
  hasMore: boolean;
}

// Grouped items type
type GroupedItems = {
  today: CombinedItem[];
  yesterday: CombinedItem[];
  lastWeek: CombinedItem[];
  lastMonth: CombinedItem[];
  older: CombinedItem[];
};

// Grouping function (should work with API response structure)
const groupItemsByDate = (items: CombinedItem[]): GroupedItems => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  // API route now sorts, so no need to sort here unless API changes
  // items.sort((a, b) => { ... });

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

export function SidebarAll() {
  const { isSignedIn } = useUser();
  const { id: activeChatId } = useParams();

  // State for fetched data
  const [fetchedData, setFetchedData] = useState<AllItemsApiResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setFetchedData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchAllItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch combined items from the API route
        const data: AllItemsApiResponse = await fetcher(
          '/api/history?type=all',
        );
        console.log('[SidebarAll] Fetched data:', data);
        setFetchedData(data);
      } catch (err: any) {
        console.error('Error fetching combined items:', err);
        setError(err);
        toast.error(`Failed to load items: ${err.message}`);
        setFetchedData(null); // Clear on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllItems();
  }, [isSignedIn]); // Re-fetch on auth change

  if (!isSignedIn) return null; // Or show login prompt

  const combinedItems = fetchedData?.items ?? [];
  const groupedItems = groupItemsByDate(combinedItems);
  const hasItems = !isLoading && combinedItems.length > 0;

  // Function to determine if an item is active
  const getIsActive = (item: CombinedItem) => {
    if (!activeChatId) return false;
    if (item.type === 'chat') {
      return item.id === activeChatId;
    }
    // Use chatId for documents
    if (item.type === 'document') {
      return item.chatId === activeChatId;
    }
    return false;
  };

  return (
    <>
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {!isLoading && error && (
              <div className="p-4 text-sm text-red-600">
                Error loading items: {error.message}
              </div>
            )}
            {!isLoading && !error && !hasItems && (
              <div className="p-4 text-sm text-muted-foreground">
                No chats or documents found.
              </div>
            )}
            {!isLoading && !error && hasItems && (
              <div className="flex flex-col gap-2 pb-2">
                {Object.entries(groupedItems).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  const groupNameMap: Record<string, string> = {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    lastWeek: 'Last 7 Days',
                    lastMonth: 'Last 30 Days',
                    older: 'Older',
                  };
                  const displayGroupName =
                    groupNameMap[groupName] ||
                    groupName.charAt(0).toUpperCase() + groupName.slice(1);

                  return (
                    <div key={groupName}>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        {displayGroupName}
                      </div>
                      {items.map((item) => {
                        // Generate a unique key based on type and primary key components
                        const uniqueKey =
                          item.type === 'chat'
                            ? `chat-${item.id}`
                            : // For documents, use id + createdAt (part of composite PK)
                              // Ensure item.createdAt is available from the API
                              `document-${item.id}-${item.createdAt || 'no-created-at'}`;

                        return (
                          <SidebarAllItem
                            // key={`${item.type}-${item.id}`} // OLD KEY
                            key={uniqueKey} // NEW KEY
                            item={item}
                            isActive={getIsActive(item)}
                            // TODO: Add delete/share handlers if actions are added
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
