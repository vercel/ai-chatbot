'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/utils';
import { unstable_serialize } from 'swr/infinite'; // For global mutation

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SidebarFiles } from './sidebar-files';
import { SidebarAll } from './sidebar-all';
import type { VisibilityType } from './visibility-selector'; // Import VisibilityType

// --- Top-Level Type Definitions (Updated ChatStub) ---
export interface ChatStub {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  visibility: VisibilityType; // Changed from string to VisibilityType
  hasDocuments: boolean;
  mostRecentDocumentTitle?: string | null; // Added optional doc title
  mostRecentDocumentModifiedAt?: Date | null; // Added: Timestamp of the latest doc
}
export interface DocumentStub {
  id: string;
  title: string;
  modifiedAt: Date; // Expect Date object after parsing
  chatId?: string | null; // Add optional chatId needed by consumers
}
export interface RecentMessage {
  id: string;
  role: string;
  createdAt: Date; // Expect Date object after parsing
}
export interface RecentChatDetails {
  messages: RecentMessage[];
  documents: DocumentStub[];
}

// API response types (Updated)
interface SidebarInitResponse {
  initialChatStubs: ChatStub[]; // Includes optional doc title AND modified date now
  recentChatDetails: Record<
    string,
    { messages: RecentMessage[]; documents: DocumentStub[] }
  >;
}
interface HistoryPage {
  items: ChatStub[];
  hasMore: boolean;
}

// --- Context Definition ---
// Uses the types defined above
interface SidebarDataContextType {
  allChatStubs: ChatStub[];
  allDocumentStubs: DocumentStub[];
  recentChatDetails: Record<string, RecentChatDetails>;
  initialFetchAttempted: boolean;
  error: any;
  hasMoreOlder: boolean;
  loadMoreOlderItems: () => void;
  mutateAllChats: (data?: any, opts?: any) => Promise<any>;
}

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(
  undefined,
);

export const useSidebarData = () => {
  const context = useContext(SidebarDataContext);
  if (context === undefined) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
};

// --- Data Hooks Implementation ---

const parseDatesInInitData = (
  data: SidebarInitResponse,
): SidebarInitResponse => {
  const parsedStubs = data.initialChatStubs.map((stub) => ({
    ...stub,
    createdAt: new Date(stub.createdAt),
    // Ensure the modifiedAt date is also parsed if it exists
    mostRecentDocumentModifiedAt: stub.mostRecentDocumentModifiedAt
      ? new Date(stub.mostRecentDocumentModifiedAt)
      : null,
    // mostRecentDocumentTitle is already string | null
  }));

  const parsedDetails: Record<string, RecentChatDetails> = {};
  for (const chatId in data.recentChatDetails) {
    const details = data.recentChatDetails[chatId];
    parsedDetails[chatId] = {
      messages: details.messages.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
      documents: details.documents.map((doc) => ({
        ...doc,
        modifiedAt: new Date(doc.modifiedAt),
      })),
    };
  }

  return {
    initialChatStubs: parsedStubs,
    recentChatDetails: parsedDetails,
  };
};

// Simplified hook: returns raw SWR state + cacheHit
const useSidebarInit = () => {
  console.log('[useSidebarInit] Hook Execution Start'); // Log hook start
  const { user, isSignedIn } = useUser();
  const userId = user?.id;
  const cacheKey = userId ? `sidebarInitData-${userId}` : null;
  const swrKey = isSignedIn ? '/api/sidebar-init' : null;
  console.log(`[useSidebarInit] cacheKey: ${cacheKey}, swrKey: ${swrKey}`); // Log keys

  const { fallbackData, cacheHit } = useMemo(() => {
    console.log('[useSidebarInit] useMemo for fallbackData START'); // Log memo start
    let data: SidebarInitResponse | undefined = undefined;
    let hit = false;
    if (typeof window !== 'undefined' && cacheKey) {
      const cachedData = localStorage.getItem(cacheKey);
      console.log(
        `[useSidebarInit] localStorage raw: ${cachedData ? `${cachedData.substring(0, 50)}...` : 'null'}`,
      ); // Fixed: Use template literal
      if (cachedData) {
        try {
          data = JSON.parse(cachedData) as SidebarInitResponse;
          hit = true;
          console.log(
            '[useSidebarInit] localStorage PARSED successfully. cacheHit=true',
          );
        } catch (e) {
          console.error('[useSidebarInit] Error parsing localStorage:', e);
          localStorage.removeItem(cacheKey);
          data = undefined;
          hit = false;
        }
      } else {
        console.log('[useSidebarInit] No data in localStorage.');
      }
    } else {
      console.log(
        '[useSidebarInit] window or cacheKey not available for localStorage check.',
      );
    }
    console.log(
      `[useSidebarInit] useMemo for fallbackData END, returning cacheHit: ${hit}`,
    ); // Log memo end
    return { fallbackData: data, cacheHit: hit };
  }, [cacheKey]);

  const {
    data, // Raw data from SWR (includes fallback)
    error,
    isLoading: isSwrLoading,
    mutate,
  } = useSWR<SidebarInitResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // revalidateIfStale: false, // TEMPORARILY COMMENTED OUT
    shouldRetryOnError: false,
    onSuccess: (fetchedData) => {
      // Save to cache on success
      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(fetchedData));
          console.log('[useSidebarInit] Data saved to localStorage.');
        } catch (e) {
          console.error('[useSidebarInit] Error saving to localStorage:', e);
        }
      }
    },
    onError: () => {
      // Clear cache on error
      if (cacheKey) {
        localStorage.removeItem(cacheKey);
        console.log('[useSidebarInit] Cache cleared on error.');
      }
    },
    fallbackData: fallbackData,
  });
  console.log(
    `[useSidebarInit] SWR hook state: isLoading=${isSwrLoading}, error=${error}, dataExists=${!!data}`,
  ); // Log SWR state

  // Return raw state + cacheHit status
  console.log(
    `[useSidebarInit] Hook Execution END, returning cacheHit: ${cacheHit}`,
  ); // Log hook end
  return {
    rawData: data,
    error,
    cacheHit,
    mutateSidebarInit: mutate,
    isSwrValidating: isSwrLoading,
  };
};

// --- Older Chats Hook ---
const useOlderChats = (
  initialChatStubs: ChatStub[] | undefined,
  mutateSidebarInit: (data?: any, opts?: any) => Promise<any>, // Receive mutate from init hook
) => {
  // getKey function for useSWRInfinite
  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: HistoryPage | null,
    ): string | null => {
      // Reached the end?
      if (previousPageData && !previousPageData.hasMore) return null;

      // First page? Construct cursor from initial data
      if (pageIndex === 0) {
        if (!initialChatStubs || initialChatStubs.length === 0) return null; // No initial data to get cursor from
        const lastInitialStub = initialChatStubs[initialChatStubs.length - 1];
        // Cursor format: ISOString_ID (ensure createdAt is Date)
        const cursor = `${lastInitialStub.createdAt.toISOString()}_${lastInitialStub.id}`;
        return `/api/history?limit=20&cursor=${cursor}`;
      }

      // Subsequent pages? Construct cursor from previous page
      // Use optional chaining (?.) for safety
      if (previousPageData?.items && previousPageData.items.length > 0) {
        const lastItem =
          previousPageData.items[previousPageData.items.length - 1];
        // Ensure createdAt is Date object after potential fetch
        const lastDate = new Date(lastItem.createdAt);
        // Check if date parsing failed using Number.isNaN
        if (Number.isNaN(lastDate.getTime())) {
          // Use Number.isNaN
          console.warn(
            '[useOlderChats getKey] Invalid date found in previous page data, stopping pagination.',
            lastItem,
          );
          return null;
        }
        const cursor = `${lastDate.toISOString()}_${lastItem.id}`;
        return `/api/history?limit=20&cursor=${cursor}`;
      }

      // Should only reach here if previous page existed but had no items (or error)
      console.warn(
        '[useOlderChats getKey] Could not determine next key, previousPageData was likely empty or invalid.',
        previousPageData,
      );
      return null;
    },
    [initialChatStubs], // Dependency: initial data influences the first key
  );

  const {
    data: olderChatsPagesData, // Array of page results
    error,
    size,
    setSize,
    isValidating,
    isLoading,
    mutate: mutateHistory, // Mutate specific to the history endpoint
  } = useSWRInfinite<HistoryPage>(getKey, fetcher, {
    revalidateFirstPage: false,
    keepPreviousData: true,
    // Parse dates in fetched older chat data
    // Note: This mutate happens *after* fetch, not ideal for immediate display
    // Consider parsing within the component or using a transform middleware if needed earlier
    // For now, parsing happens when combining data
  });

  // Combine mutate functions for a unified approach if needed
  const mutateAllChats = useCallback(
    async (newDataProducer?: any, opts?: any) => {
      // A simple example: refetch everything
      // More complex logic could update specific items in both caches
      console.log(
        '[mutateAllChats] Triggering mutation for init and history...',
      );
      await mutateSidebarInit(undefined, { revalidate: true, ...opts });
      // Mutate all pages of history? Or just specific ones? Using unstable_serialize for all.
      await mutateHistory(undefined, { revalidate: true, ...opts });
    },
    [mutateSidebarInit, mutateHistory],
  );

  // Parse dates in older chat pages
  const olderChatsPages = useMemo(() => {
    return olderChatsPagesData?.map((page) => ({
      ...page,
      items: page.items.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      })),
    }));
  }, [olderChatsPagesData]);

  const isLoadingMore = isLoading || isValidating;
  const hasMoreOlder =
    olderChatsPages &&
    olderChatsPages.length > 0 &&
    olderChatsPages[olderChatsPages.length - 1]?.hasMore === true;

  return {
    olderChatsPages,
    isLoadingMore,
    hasMoreOlder,
    size,
    setSize,
    error,
    mutateHistory, // Expose history mutate
    mutateAllChats, // Expose combined mutate
  };
};
// --- End Data Hooks Implementation ---

export function AppSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState<string>('chats');

  useEffect(() => {
    const savedTab = localStorage.getItem('sidebarActiveTab');
    if (savedTab && ['all', 'chats', 'files'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('sidebarActiveTab', value);
  };

  // --- Data Fetching & Context Setup ---
  const {
    rawData,
    error: errorInit,
    cacheHit,
    mutateSidebarInit,
    isSwrValidating,
  } = useSidebarInit();
  console.log(
    `[AppSidebar] useSidebarInit results: cacheHit=${cacheHit}, errorInit=${errorInit}, rawDataExists=${!!rawData}`,
  ); // Log hook results

  // ---- Parse Initial Data ----
  const parsedSidebarInitData = useMemo(() => {
    console.log('[AppSidebar] useMemo for parsedSidebarInitData START'); // Log parse memo start
    if (!rawData) {
      console.log('[AppSidebar] No rawData to parse.');
      return undefined;
    }
    console.log('[AppSidebar] Parsing rawData...');
    try {
      const parsed = parseDatesInInitData(rawData);
      console.log('[AppSidebar] Parsing SUCCESSFUL.');
      return parsed;
    } catch (e) {
      console.error('[AppSidebar] Error parsing initial data:', e, rawData);
      console.log('[AppSidebar] Parsing FAILED.');
      return undefined;
    }
  }, [rawData]);
  console.log(
    `[AppSidebar] parsedSidebarInitData exists: ${!!parsedSidebarInitData}`,
  ); // Log parse result

  // Use the PARSED data from here on
  const initialChatStubs = parsedSidebarInitData?.initialChatStubs;

  // Derive initialFetchAttempted state here
  const derivedInitialFetchAttempted = useMemo(() => {
    console.log('[AppSidebar] useMemo for derivedInitialFetchAttempted START'); // Log attempt memo start
    // **Simplified Logic Proposal:** If cache was hit, consider attempt complete for UI purposes
    // Or if an error occurred (meaning fetch *was* attempted and failed)
    const attempted = cacheHit || errorInit !== undefined;
    // Original logic kept for reference:
    // const attempted_original = cacheHit || parsedSidebarInitData !== undefined || errorInit !== undefined;
    console.log(
      `[AppSidebar] derivedInitialFetchAttempted: ${attempted} (cacheHit=${cacheHit}, errorInitExists=${errorInit !== undefined})`,
    );
    return attempted;
    // ** End Simplified Logic **
  }, [cacheHit, errorInit]); // Removed parsedSidebarInitData dependency
  console.log(
    `[AppSidebar] derivedInitialFetchAttempted value: ${derivedInitialFetchAttempted}`,
  ); // Log attempt result

  // Pass correct mutate function to useOlderChats
  const {
    olderChatsPages,
    isLoadingMore,
    hasMoreOlder,
    size,
    setSize,
    error: errorOlder,
    mutateAllChats,
  } = useOlderChats(initialChatStubs, mutateSidebarInit);

  // Combine chat stubs
  const allChatStubs = useMemo(() => {
    const initialStubs = parsedSidebarInitData?.initialChatStubs ?? [];
    const olderStubs = olderChatsPages?.flatMap((page) => page.items) ?? [];

    // Create a Map starting with older stubs
    const chatMap = new Map(olderStubs.map((chat) => [chat.id, chat]));

    // Overwrite/add initial stubs, ensuring they take precedence
    initialStubs.forEach((chat) => {
      chatMap.set(chat.id, chat); // This prioritizes the initialStub version
    });

    // Convert the Map values back to an array
    const uniqueChats = Array.from(chatMap.values());

    // Sort by createdAt descending (assuming this is desired)
    uniqueChats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ---- DEBUG LOG: Check combined/unique stubs ----
    const validForFilesCount = uniqueChats.filter(
      (stub) =>
        stub.hasDocuments &&
        stub.mostRecentDocumentTitle &&
        stub.mostRecentDocumentModifiedAt,
    ).length;
    console.log(
      `[DEBUG AppSidebar Stubs] Combined ${uniqueChats.length} stubs, Valid for Files: ${validForFilesCount}`,
    );
    // ---- END DEBUG LOG ----
    return uniqueChats;
  }, [parsedSidebarInitData?.initialChatStubs, olderChatsPages]);

  // Extract all document stubs (now potentially includes more than just recent)
  const allDocumentStubs: DocumentStub[] = useMemo(() => {
    // Primary source: Documents attached to recent chats
    const docsFromRecent = Object.values(
      parsedSidebarInitData?.recentChatDetails ?? {},
    ).flatMap((detail) => detail.documents);
    // We don't have a separate `initialDocumentStubs` list in this plan revision.
    // The API only adds `mostRecentDocumentTitle` to `initialChatStubs`.
    // To get full stubs for older docs, a different API fetch would be needed later.
    // For now, stick to docs from recent details.
    const uniqueDocs = Array.from(
      new Map(docsFromRecent.map((doc) => [doc.id, doc])).values(),
    );
    // Maybe sort them by modifiedAt descending?
    uniqueDocs.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    return uniqueDocs;
  }, [parsedSidebarInitData?.recentChatDetails]);

  const loadMoreOlderItems = useCallback(() => {
    if (!isLoadingMore && hasMoreOlder) {
      setSize(size + 1);
    }
  }, [isLoadingMore, hasMoreOlder, setSize, size]);

  // Update context value with derived state and document stubs
  const contextValue: SidebarDataContextType = useMemo(
    () => ({
      allChatStubs,
      allDocumentStubs, // Provide the extracted document stubs
      recentChatDetails: parsedSidebarInitData?.recentChatDetails ?? {},
      initialFetchAttempted: derivedInitialFetchAttempted,
      error: errorInit || errorOlder,
      hasMoreOlder: hasMoreOlder ?? false,
      loadMoreOlderItems,
      mutateAllChats,
    }),
    [
      allChatStubs,
      allDocumentStubs, // Add dependency
      parsedSidebarInitData?.recentChatDetails,
      derivedInitialFetchAttempted,
      errorInit,
      errorOlder,
      hasMoreOlder,
      loadMoreOlderItems,
      mutateAllChats,
    ],
  );
  console.log(
    `[AppSidebar] Context value created. initialFetchAttempted=${contextValue.initialFetchAttempted}`,
  ); // Log context value

  console.log('[AppSidebar] Component Render END'); // Log component render end
  return (
    <SidebarDataProvider value={contextValue}>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                  SuperChat
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
                      mutateAllChats();
                    }}
                  >
                    <PlusIcon /> New
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <Tabs
            value={activeTab} // Controlled component
            onValueChange={handleTabChange} // Update state and localStorage
            className="w-full"
          >
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-3 h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger
                  value="all"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="chats"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  Chats
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  Files
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all">
              <SidebarAll />
            </TabsContent>
            <TabsContent value="chats">
              <SidebarHistory />
            </TabsContent>
            <TabsContent value="files">
              <SidebarFiles />
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter>
          <SidebarUserNav />
        </SidebarFooter>
      </Sidebar>
    </SidebarDataProvider>
  );
}

// Renamed Provider component
const SidebarDataProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarDataContextType;
}) => {
  return (
    <SidebarDataContext.Provider value={value}>
      {children}
    </SidebarDataContext.Provider>
  );
};
