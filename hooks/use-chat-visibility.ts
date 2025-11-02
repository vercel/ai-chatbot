"use client";

import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
// Stateless: Visibility managed client-side
import {
  type ChatHistory,
  getChatHistoryPaginationKey,
} from "@/components/sidebar-history";
import type { VisibilityType } from "@/components/visibility-selector";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: ChatHistory = cache.get("/api/history")?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    }
  );

  const visibilityType = useMemo(() => {
    if (!history) {
      return localVisibility;
    }
    // In stateless mode, chats array is typed as never[], so we can't find chats
    // Just return the local visibility or default to private
    const chats = history.chats as Array<{ id: string; visibility: VisibilityType }>;
    const chat = chats.find((currentChat) => currentChat.id === chatId);
    if (!chat) {
      return "private";
    }
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    // Stateless: Visibility updated client-side only
    setLocalVisibility(updatedVisibilityType);
    mutate(unstable_serialize(getChatHistoryPaginationKey));
  };

  return { visibilityType, setVisibilityType };
}
