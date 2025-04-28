'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/(chat)/actions';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
// import {
//   getChatHistoryPaginationKey,
//   type ChatHistory,
// } from '@/components/sidebar-history';
import type { VisibilityType } from '@/components/visibility-selector';
import type { DBChat } from './db/schema';
import { toast } from 'react-hot-toast';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  // Remove unused variable and potentially problematic cache access
  // const history: ChatHistory = cache.get('/api/history')?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    // Remove dependency on removed 'history' variable
    // if (!history) return localVisibility;
    // const chat = history.items.find((chat) => chat.id === chatId);
    // if (!chat) return 'private'; // Default if chat not found in (removed) history cache?
    // return chat.visibility;

    // Simplify: Rely solely on the local SWR state for visibility
    return localVisibility;
  }, [localVisibility]); // Only depend on localVisibility now

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    // REMOVE/COMMENT OUT: Mutate related to unused SWRInfinite for history
    // mutate(unstable_serialize(getChatHistoryPaginationKey));

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  const { pathname, router, searchParams } = useRouter();

  // COMMENT OUT THIS LINE (history invalidation handled by optimistic update/API route)
  // if (chatId) {
  //   mutate((key) => typeof key === 'string' && key.includes(`/api/chat?id=${chatId}`), undefined, { revalidate: true });
  // }
  // History list mutation needs to happen AFTER navigation/state settled
  // Ensure SWR infinite history query is revalidated
  // mutate(unstable_serialize(getChatHistoryPaginationKey));

  // COMMENT OUT THIS LINE (not directly related, was for older history approach)
  // mutate<HistoryPage[]>((key) => typeof key === 'string' && key.includes('/api/history'), undefined, { revalidate: true });

  const updateVisibility = useCallback(
    async (visibility: VisibilityType) => {
      if (!chatId) return;

      // Temporarily store current visibility
      const previousVisibility = visibilityType;
      // Optimistically update the UI
      setVisibilityType(visibility);

      try {
        await updateChatVisibility(chatId, visibility);
        toast.success('Chat visibility updated.');
        // Optionally revalidate specific chat data if needed, but history handled elsewhere
        // mutate((key) => typeof key === 'string' && key.includes(`/api/chat?id=${chatId}`));
      } catch (error) {
        // Revert optimistic update on error
        setVisibilityType(previousVisibility);
        toast.error(
          `Failed to update chat visibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [
      pathname,
      router,
      searchParams,
      chatId,
      visibilityType,
      setVisibilityType,
      mutate,
    ],
  );

  return { visibilityType, setVisibilityType };
}
