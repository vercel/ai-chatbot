"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { MemoryItem } from "@/lib/memory/storage";
import {
  getMemories,
  addMemory as addMemoryToStorage,
  deleteMemory as deleteMemoryFromStorage,
  togglePinMemory as togglePinMemoryInStorage,
  clearMemories as clearMemoriesFromStorage,
} from "@/lib/memory/storage";
import { SEED_MEMORIES } from "@/lib/memory/seed";

type MemoryContextValue = {
  memories: MemoryItem[];
  addMemory: (content: string, category?: MemoryItem['category']) => void;
  deleteMemory: (id: string) => void;
  togglePin: (id: string) => void;
  clearAll: () => void;
};

const MemoryContext = createContext<MemoryContextValue | undefined>(undefined);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Load memories on mount, seed if empty
  useEffect(() => {
    const stored = getMemories();

    if (stored.length === 0) {
      // First time - add seed memories
      const seeded = SEED_MEMORIES.map((seed) => ({
        ...seed,
        id: crypto.randomUUID(),
      }));
      setMemories(seeded);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('glen-ai-memories', JSON.stringify(seeded));
      }
    } else {
      setMemories(stored);
    }
  }, []);

  const addMemory = (content: string, category: MemoryItem['category'] = 'topic') => {
    const newMemory = addMemoryToStorage(content, category);
    setMemories(prev => [newMemory, ...prev].slice(0, 50));
  };

  const deleteMemory = (id: string) => {
    deleteMemoryFromStorage(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const togglePin = (id: string) => {
    togglePinMemoryInStorage(id);
    setMemories(prev => prev.map(m =>
      m.id === id ? { ...m, pinned: !m.pinned } : m
    ));
  };

  const clearAll = () => {
    clearMemoriesFromStorage();
    setMemories([]);
  };

  return (
    <MemoryContext.Provider value={{ memories, addMemory, deleteMemory, togglePin, clearAll }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within MemoryProvider");
  }
  return context;
}
