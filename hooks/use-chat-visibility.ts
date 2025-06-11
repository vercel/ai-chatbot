/**
 * @file hooks/use-chat-visibility.ts
 * @description Хук для управления видимостью чата.
 * @version 1.2.1
 * @date 2025-06-06
 * @updated Исправлен импорт VisibilityType на новый путь из lib/types.
 */

/** HISTORY:
 * v1.2.1 (2025-06-06): Исправлен путь импорта VisibilityType.
 * v1.2.0 (2025-06-05): Переименована переменная 'history' и добавлена проверка данных из кеша.
 * v1.1.0 (2025-06-05): Адаптирован для безопасного вызова без chatId, чтобы избежать нарушения правил хуков.
 * v1.0.0 (2025-06-05): Начальная версия хука.
 */

'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/app/(main)/chat/actions';
import {
  getChatHistoryPaginationKey,
  type ChatHistory,
} from '@/components/sidebar-history';
import type { VisibilityType } from '@/lib/types';
import type { Chat } from '@/lib/db/schema';

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId?: string;
  initialVisibilityType?: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const isEnabled = !!chatId;

  const swrKey = isEnabled ? `${chatId}-visibility` : null;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    swrKey,
    null,
    {
      fallbackData: initialVisibilityType,
    },
  );

  const visibilityType = useMemo(() => {
    if (!isEnabled) return initialVisibilityType || 'private';

    const chatHistoryCache: any = cache.get(unstable_serialize(getChatHistoryPaginationKey));

    // Проверяем, что кэш и данные в нем существуют
    if (!chatHistoryCache || !chatHistoryCache.data) return localVisibility;

    // Итерируемся по массиву страниц от useSWRInfinite
    for (const page of chatHistoryCache.data) {
      if (page?.chats) {
        const chat = page.chats.find((c: Chat) => c.id === chatId);
        if (chat) return chat.visibility;
      }
    }

    return localVisibility || initialVisibilityType || 'private';
  }, [isEnabled, chatId, cache, localVisibility, initialVisibilityType]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    if (!isEnabled || !chatId) return;

    setLocalVisibility(updatedVisibilityType, false);

    mutate(
        unstable_serialize(getChatHistoryPaginationKey),
        (currentData: any) => {
            if (!currentData) return currentData;
            return currentData.map((page: ChatHistory) => ({
                ...page,
                chats: page.chats.map((chat: Chat) =>
                    chat.id === chatId ? { ...chat, visibility: updatedVisibilityType } : chat
                ),
            }));
        },
        { revalidate: false }
    );

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}

// END OF: hooks/use-chat-visibility.ts