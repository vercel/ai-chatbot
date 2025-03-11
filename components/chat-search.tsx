'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Command,
} from '@/components/ui/command';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageCircle, PenSquare } from 'lucide-react';
import useSWR from 'swr';
import { useDebounceValue } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { groupChatsByDate, fetcher, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { GroupedChats } from '@/lib/utils';
import { useArtifact } from '@/hooks/use-artifact';

const SKELETON_LENGTHS = [
  ['w-1/2', '3/4'],
  ['w-3/5', '4/6'],
  ['w-3/4', 'w-full'],
  ['w-1/2', '1/2'],
  ['w-2/4', '3/4'],
  ['w-3/4', '3/4'],
  ['w-2/4', 'w-full'],
  ['w-3/4', '2/3'],
];

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {SKELETON_LENGTHS.map((lengths, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: This is a static skeleton component with fixed array
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="size-6 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-4 ${lengths[0]} rounded bg-muted`} />
            <Skeleton className={`h-3 ${lengths[1]} rounded bg-muted`} />
          </div>
        </div>
      ))}
    </div>
  );
}

const ORDERED_GROUP_KEYS = [
  'today',
  'yesterday',
  'lastWeek',
  'lastMonth',
  'older',
] as const;

function getGroupLabel(key: (typeof ORDERED_GROUP_KEYS)[number]) {
  return {
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    older: 'Older',
  }[key];
}

type ChatGroupsProps = {
  /**
   * The groups of chats to display
   */
  groups: Record<string, any[]>;
  /**
   * The function to call when an item is selected
   */
  onSelect: (itemId: string) => void;
};

function PureChatGroups({ groups, onSelect }: ChatGroupsProps) {
  if (Object.keys(groups).length === 0) return null;

  return ORDERED_GROUP_KEYS.map((groupKey) => {
    const items = groups[groupKey] || [];
    if (!items || items.length === 0) return null;

    return (
      <CommandGroup key={groupKey} heading={getGroupLabel(groupKey)}>
        {items.map((item) => (
          <CommandItem
            key={item.id}
            onSelect={() => onSelect(item.id)}
            value={item.id}
          >
            <MessageCircle className="mr-2" />
            <div className="flex-1">
              <p>{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.preview}</p>
            </div>
            <time
              dateTime={item.createdAt}
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              {formatDate(item.createdAt)}
            </time>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  });
}

const ChatGroups = memo(PureChatGroups);

// SWR configuration
const COMMON_SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
};

enum ViewState {
  LOADING = 'LOADING',
  NO_RESULTS = 'NO_RESULTS',
  HISTORY = 'HISTORY',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
}

type Props = {
  /**
   * Whether the search dialog is open
   */
  open: boolean;
  /**
   * Callback function to open or close the search dialog
   */
  onOpenChange: (open: boolean) => void;
};

export function ChatSearch({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { setArtifact } = useArtifact();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const [debouncedSearchQuery] = useDebounceValue(trimmedSearchQuery, 500);

  // Fetch search results only when we have a debounced query
  const { data: searchResults, isLoading: isSearchLoading } = useSWR(
    debouncedSearchQuery
      ? `/api/search?q=${encodeURIComponent(debouncedSearchQuery)}`
      : null,
    fetcher,
    COMMON_SWR_CONFIG
  );

  // Fetch chat history only when no search is active
  const { data: chatHistory, isLoading: isChatHistoryLoading } = useSWR(
    trimmedSearchQuery === '' ? '/api/history' : null,
    fetcher,
    {
      ...COMMON_SWR_CONFIG,
      keepPreviousData: true,
      fallbackData: [],
    }
  );

  // Process chat history only when needed
  const groupedHistory = useMemo((): GroupedChats => {
    if (trimmedSearchQuery !== '')
      return {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      };
    return groupChatsByDate(chatHistory || []);
  }, [chatHistory, trimmedSearchQuery]);

  // Determine the current view state based on search state
  const viewState = useMemo((): ViewState => {
    // If the search field is cleared, immediately show history
    if (trimmedSearchQuery === '') {
      return isChatHistoryLoading ? ViewState.LOADING : ViewState.HISTORY;
    }

    // Show loading state when: Actively searching OR search hasn't been debounced yet
    if (isSearchLoading || debouncedSearchQuery !== trimmedSearchQuery) {
      return ViewState.LOADING;
    }

    // Show "no results" when search completed but nothing found
    if (
      !searchResults ||
      Object.keys(searchResults).length === 0 ||
      !Object.values(searchResults).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      )
    ) {
      return ViewState.NO_RESULTS;
    }

    // Otherwise, show search results
    return ViewState.SEARCH_RESULTS;
  }, [
    trimmedSearchQuery,
    debouncedSearchQuery,
    isSearchLoading,
    isChatHistoryLoading,
    searchResults,
  ]);

  const handleItemSelect = useCallback(
    (itemId: string) => {
      onOpenChange(false);

      // If the user has an artifact open, close it
      setArtifact((currentArtifact) => {
        if (currentArtifact) {
          return {
            ...currentArtifact,
            isVisible: false,
          };
        }
        return currentArtifact;
      });
      router.push(itemId === 'new-chat' ? '/' : `/chat/${itemId}`);
      router.refresh();
    },
    [onOpenChange, router, setArtifact]
  );

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Render content based on view state (computed once per render)
  let listContent: React.ReactNode;

  if (viewState === ViewState.LOADING) {
    listContent = <SearchSkeleton />;
  } else if (viewState === ViewState.NO_RESULTS) {
    listContent = <CommandEmpty>No results found</CommandEmpty>;
  } else if (viewState === ViewState.SEARCH_RESULTS) {
    listContent = (
      <ChatGroups groups={searchResults} onSelect={handleItemSelect} />
    );
  } else {
    // HISTORY state
    listContent = (
      <>
        <CommandGroup>
          <CommandItem
            onSelect={() => handleItemSelect('new-chat')}
            key="new-chat"
            value="new-chat"
          >
            <PenSquare className="mr-2 text-muted-foreground" />
            New Chat
          </CommandItem>
        </CommandGroup>
        <CommandList className="flex-1 overflow-y-auto max-h-none">
          <ChatGroups groups={groupedHistory} onSelect={handleItemSelect} />
        </CommandList>
      </>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search Chats</DialogTitle>
      <DialogDescription className="sr-only">
        Search through your existing chats or create a new chat
      </DialogDescription>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search chats..."
          value={searchQuery}
          onValueChange={handleSearchInputChange}
          autoFocus
        />
        <div className="max-h-[80vh] h-[min(500px,_70vh)] flex flex-col">
          <CommandList className="flex-1 overflow-y-auto max-h-none">
            {listContent}
          </CommandList>
          <div className="border-t p-2 flex items-center justify-end text-xs mt-auto">
            <div className="flex items-center mr-2 border-r border-muted pr-2">
              <span className="text-muted-foreground">Open</span>
              <kbd className="ml-2 bg-muted px-2 py-0.5 rounded text-muted-foreground">
                ↵
              </kbd>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground">Toggle Search</span>
              <kbd className="ml-2 bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {navigator?.userAgent?.toLowerCase().includes('mac')
                  ? '⌘'
                  : 'Ctrl'}
              </kbd>
              <span className="mx-1 text-muted-foreground">+</span>
              <kbd className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                K
              </kbd>
            </div>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
