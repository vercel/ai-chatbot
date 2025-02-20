'use client';

import { useEffect, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { updateChatVisibility } from '@/app/(chat)/actions';
import { VisibilityType } from '@/components/visibility-selector';
import { Chat } from '@/lib/db/schema';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: Array<Chat> = cache.get('/api/history')?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.find((chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);

    mutate<Array<Chat>>(
      '/api/history',
      (history) => {
        return history
          ? history.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  visibility: updatedVisibilityType,
                };
              }
              return chat;
            })
          : [];
      },
      { revalidate: false },
    );

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  const toggleVisibilityType = () => {
    const newVisibilityType = visibilityType === 'private' ? 'public' : 'private';
    setVisibilityType(newVisibilityType);
  };

  const resetVisibilityType = () => {
    setVisibilityType(initialVisibility);
  };

  const batchUpdateVisibility = (chatIds: string[], newVisibilityType: VisibilityType) => {
    chatIds.forEach(id => {
      setLocalVisibility(newVisibilityType);
      mutate<Array<Chat>>(
        '/api/history',
        (history) => {
          return history
            ? history.map((chat) => {
                if (chat.id === id) {
                  return {
                    ...chat,
                    visibility: newVisibilityType,
                  };
                }
                return chat;
              })
            : [];
        },
        { revalidate: false }
      );
      updateChatVisibility({
        chatId: id,
        visibility: newVisibilityType,
      });
    });
  };

  useEffect(() => {
    localStorage.setItem(`${chatId}-visibility`, visibilityType);
  }, [chatId, visibilityType]);

  useEffect(() => {
    const storedVisibility = localStorage.getItem(`${chatId}-visibility`);
    if (storedVisibility) {
      setLocalVisibility(storedVisibility as VisibilityType);
    }
  }, [chatId]);

  const getPublicChats = () => {
    return history ? history.filter(chat => chat.visibility === 'public') : [];
  };

  return {
    visibilityType,
    setVisibilityType,
    toggleVisibilityType,
    resetVisibilityType,
    batchUpdateVisibility,
    getPublicChats,
  };
}

