"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { VisibilityType } from "@/components/visibility-selector";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  // Chat removed: manage visibility locally only

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    }
  );

  const visibilityType = useMemo(() => localVisibility, [localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
  // No-op server sync (chat removed)
  };

  return { visibilityType, setVisibilityType };
}
