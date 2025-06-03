'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';

export function useChatModel(initialModel: string) {
  const [selectedChatModel, setSelectedChatModel] = useState(initialModel);

  // Update the model and save to cookie
  const updateChatModel = useCallback(async (modelId: string) => {
    setSelectedChatModel(modelId);
    await saveChatModelAsCookie(modelId);
  }, []);

  // Listen for storage events (when cookie changes in other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const modelFromCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('chat-model='))
        ?.split('=')[1];

      if (modelFromCookie && modelFromCookie !== selectedChatModel) {
        setSelectedChatModel(modelFromCookie);
      }
    };

    // Check once on mount
    handleStorageChange();

    // Listen for storage events (for cross-tab sync)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedChatModel]);

  return {
    selectedChatModel,
    updateChatModel,
  };
}
