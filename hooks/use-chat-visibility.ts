'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/(chat)/actions';
// Remove unused imports from sidebar-history
// import {
//   getChatHistoryPaginationKey,
//   type ChatHistory,
// } from '@/components/sidebar-history';
import type { VisibilityType } from '@/components/visibility-selector';

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

  return { visibilityType, setVisibilityType };
}
