'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ChatLayout = 'bubble' | 'wide';

interface ChatLayoutContextType {
  layout: ChatLayout;
  setLayout: (layout: ChatLayout) => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(
  undefined,
);

export function ChatLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState<ChatLayout>('bubble');

  useEffect(() => {
    const stored = localStorage.getItem('chatLayout') as ChatLayout;
    if (stored && (stored === 'bubble' || stored === 'wide')) {
      setLayoutState(stored);
    }
  }, []);

  const setLayout = (newLayout: ChatLayout) => {
    setLayoutState(newLayout);
    localStorage.setItem('chatLayout', newLayout);
  };

  return (
    <ChatLayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </ChatLayoutContext.Provider>
  );
}

export function useChatLayout() {
  const context = useContext(ChatLayoutContext);
  if (context === undefined) {
    throw new Error('useChatLayout must be used within a ChatLayoutProvider');
  }
  return context;
}
