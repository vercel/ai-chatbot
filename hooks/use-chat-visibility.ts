'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/(chat)/actions';
import {
  getChatHistoryPaginationKey,
  type ChatHistory,
} from '@/components/sidebar-history';
import type { VisibilityType } from '@/components/visibility-selector';
import type { Chat as DBChat } from '@/lib/db/schema';
import { toast } from 'sonner';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: ChatHistory | undefined = cache.get('/api/history')?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.items.find((chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = async (updatedVisibilityType: VisibilityType) => {
    if (!chatId) return;

    setLocalVisibility(updatedVisibilityType);

    mutate(unstable_serialize(getChatHistoryPaginationKey));

    try {
      await updateChatVisibility({
        chatId: chatId,
        visibility: updatedVisibilityType,
      });
      toast.success('Chat visibility updated.');
    } catch (error) {
      console.error(
        `Failed to update chat visibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return { visibilityType, setVisibilityType };
}
