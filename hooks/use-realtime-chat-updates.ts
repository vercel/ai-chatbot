'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useSWRConfig } from 'swr';
import { useAuth } from '@clerk/nextjs';
import type { DBChat } from '@/lib/db/schema'; // Assuming Chat type is available

// Define a more specific type for the SWR cache data if possible
// For now, using a generic Chat array
// type HistoryCache = DBChat[]; // Old type for flat list

// Define the type for a single page of chat history, matching useSWRInfinite structure
interface ChatHistoryPage {
  items: DBChat[];
  hasMore: boolean;
}

// The cache data for useSWRInfinite is an array of these pages
type PaginatedHistoryCache = ChatHistoryPage[];

export function useRealtimeChatUpdates() {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();

  // Use a ref to store the Supabase client and channel instance
  // to ensure they persist across re-renders without causing re-subscriptions
  // and to manage them in the cleanup function.
  const supabaseClientRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Flag to prevent multiple initializations if effect runs multiple times in strict mode
    let isInitialized = false;

    const initializeAndSubscribe = async () => {
      if (isInitialized || supabaseClientRef.current) {
        console.log(
          '[useRealtimeChatUpdates] Already initialized or initializing.',
        );
        return;
      }
      isInitialized = true;
      console.log('[useRealtimeChatUpdates] Initializing and subscribing...');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error(
          '[useRealtimeChatUpdates] Missing Supabase URL or Anon Key in environment variables.',
        );
        isInitialized = false; // Reset for potential retry
        return;
      }

      const supabaseAccessToken = await getToken({ template: 'supabase' });

      if (!supabaseAccessToken) {
        console.warn(
          '[useRealtimeChatUpdates] No Supabase access token from Clerk. Real-time subscription cannot be authenticated.',
        );
        isInitialized = false; // Reset for potential retry if token becomes available
        return;
      }

      console.log('[useRealtimeChatUpdates] Supabase access token obtained.');

      const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseAccessToken}`,
          },
        },
        realtime: {
          params: {
            log_level: 'info', // More detailed Realtime logs
          },
        },
      });
      supabaseClientRef.current = client;
      console.log('[useRealtimeChatUpdates] Supabase client initialized.');

      // --- Subscription Logic ---
      if (supabaseClientRef.current) {
        channelRef.current = supabaseClientRef.current
          .channel('realtime-chat-updates') // Unique channel name
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Chat' },
            (payload) => {
              console.log(
                '[useRealtimeChatUpdates] Chat change received:',
                payload,
              );

              const { eventType, new: newRecord, old: oldRecord } = payload;
              const keyMatcher = (key: unknown): key is string =>
                typeof key === 'string' &&
                key.startsWith('/api/history?limit=');

              if (eventType === 'INSERT') {
                const newChat = newRecord as DBChat;
                console.log('[useRealtimeChatUpdates] INSERT event:', newChat);
                mutate(
                  keyMatcher,
                  (
                    currentData: PaginatedHistoryCache | undefined,
                  ): PaginatedHistoryCache | undefined => {
                    if (!currentData || currentData.length === 0) {
                      return [{ items: [newChat], hasMore: true }];
                    }
                    const newPages = [...currentData];
                    const firstPage = newPages[0];
                    // Use optional chaining for firstPage.items access
                    if (
                      firstPage?.items &&
                      !firstPage.items.find((chat) => chat.id === newChat.id)
                    ) {
                      newPages[0] = {
                        ...firstPage,
                        items: [newChat, ...firstPage.items],
                      };
                    } else if (!firstPage?.items) {
                      // If firstPage exists but firstPage.items is null/undefined
                      newPages[0] = {
                        ...firstPage,
                        items: [newChat],
                        hasMore: firstPage.hasMore,
                      };
                    } else if (!firstPage) {
                      // Fallback if newPages[0] was undefined for some reason
                      newPages[0] = { items: [newChat], hasMore: true };
                    }
                    return newPages;
                  },
                  false,
                );
              } else if (eventType === 'UPDATE') {
                const updatedChat = newRecord as DBChat;
                console.log(
                  '[useRealtimeChatUpdates] UPDATE event:',
                  updatedChat,
                );
                mutate(
                  keyMatcher,
                  (
                    currentData: PaginatedHistoryCache | undefined,
                  ): PaginatedHistoryCache | undefined => {
                    if (!currentData) return undefined;
                    return currentData.map((page) => ({
                      ...page,
                      items: page.items.map((chat) =>
                        chat.id === updatedChat.id ? updatedChat : chat,
                      ),
                    }));
                  },
                  false,
                );
              } else if (eventType === 'DELETE') {
                const deletedRecord = oldRecord as Partial<DBChat>;
                const deletedChatId = deletedRecord.id;
                if (!deletedChatId) {
                  console.warn(
                    '[useRealtimeChatUpdates] DELETE event received without an ID in oldRecord:',
                    oldRecord,
                  );
                  return;
                }
                console.log(
                  '[useRealtimeChatUpdates] DELETE event, ID:',
                  deletedChatId,
                );
                mutate(
                  keyMatcher,
                  (
                    currentData: PaginatedHistoryCache | undefined,
                  ): PaginatedHistoryCache | undefined => {
                    if (!currentData) return undefined;
                    return currentData
                      .map((page) => ({
                        ...page,
                        items: page.items.filter(
                          (chat) => chat.id !== deletedChatId,
                        ),
                      }))
                      .filter(
                        (page) =>
                          page.items.length > 0 || currentData.length === 1,
                      ); // Keep page if it has items, or if it's the only page (even if now empty)
                  },
                  false,
                );
              }
            },
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(
                '[useRealtimeChatUpdates] Successfully subscribed to Chat table changes',
              );
            } else if (status === 'CHANNEL_ERROR') {
              console.error(
                '[useRealtimeChatUpdates] Realtime channel error:',
                err,
              );
            } else if (status === 'TIMED_OUT') {
              console.warn(
                '[useRealtimeChatUpdates] Realtime subscription timed out.',
              );
            } else {
              console.log(
                '[useRealtimeChatUpdates] Realtime subscription status:',
                status,
              );
            }
          });
        console.log('[useRealtimeChatUpdates] Subscription process initiated.');
      } else {
        console.warn(
          '[useRealtimeChatUpdates] Supabase client not available for subscription.',
        );
        isInitialized = false; // Allow re-initialization if client becomes available
      }
    };

    initializeAndSubscribe();

    return () => {
      console.log('[useRealtimeChatUpdates] Cleaning up hook...');
      isInitialized = false; // Reset for next mount if any
      if (channelRef.current && supabaseClientRef.current) {
        console.log(
          '[useRealtimeChatUpdates] Unsubscribing from channel and removing it.',
        );
        supabaseClientRef.current
          .removeChannel(channelRef.current)
          .then((status) => {
            console.log(
              '[useRealtimeChatUpdates] Channel removal status:',
              status,
            );
          })
          .catch((error) => {
            console.error(
              '[useRealtimeChatUpdates] Error removing channel:',
              error,
            );
          });
        channelRef.current = null;
      }
      // It's generally not recommended to nullify the client itself here
      // unless there's a specific reason to force re-creation on next effect run.
      // supabaseClientRef.current = null;
    };
  }, [getToken, mutate]); // Added mutate as it will be used for SWR cache updates
}
