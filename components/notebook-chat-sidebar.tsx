'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import { Separator } from '@/components/ui/separator';
import { NotebookIntegratedChat } from '@/components/notebook-integrated-chat';
import { ModelSelector } from '@/components/model-selector';
import { getCookie, setCookie } from 'cookies-next';
import { generateUUID } from '@/lib/utils';

export function NotebookChatSidebar() {
  const [chatId, setChatId] = useState<string>('');
  const [selectedChatModel, setSelectedChatModel] = useState<string>(DEFAULT_CHAT_MODEL);

  // Initialize chat ID and model from cookies when the component mounts
  useEffect(() => {
    // Generate a new chat ID if one doesn't exist
    const storedChatId = getCookie('notebookChatId');
    if (storedChatId) {
      setChatId(storedChatId as string);
    } else {
      const newChatId = generateUUID();
      setCookie('notebookChatId', newChatId, { maxAge: 60 * 60 * 24 * 7 }); // 1 week
      setChatId(newChatId);
    }

    // Get selected model from cookies
    const storedModel = getCookie('selectedChatModel');
    if (storedModel) {
      setSelectedChatModel(storedModel as string);
    }
  }, []);

  // Listen for changes to the selected model
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedChatModel' && e.newValue) {
        setSelectedChatModel(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Start a new chat
  const startNewChat = () => {
    const newChatId = generateUUID();
    setCookie('notebookChatId', newChatId, { maxAge: 60 * 60 * 24 * 7 });
    setChatId(newChatId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button
          onClick={startNewChat}
          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          New Chat
        </button>
      </div>
      
      <div className="px-4 pb-2">
        <ModelSelector selectedModelId={selectedChatModel} />
      </div>

      <Separator />
      
      {chatId && (
        <div className="flex-1 overflow-hidden">
          <NotebookIntegratedChat 
            id={chatId}
            selectedChatModel={selectedChatModel}
          />
        </div>
      )}
    </div>
  );
} 