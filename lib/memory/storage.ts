export type MemoryItem = {
  id: string;
  content: string;
  source: "user" | "chat" | "avatar" | "call";
  timestamp: string;
  pinned?: boolean;
};

const STORAGE_KEY = "glen-ai-memories";

export function getMemories(): MemoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveMemories(memories: MemoryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error("Failed to save memories:", error);
  }
}

export function addMemory(
  content: string,
  source: MemoryItem["source"] = "chat"
): MemoryItem {
  const newMemory: MemoryItem = {
    id: crypto.randomUUID(),
    content,
    source,
    timestamp: new Date().toISOString(),
    pinned: false,
  };

  const memories = getMemories();
  const updated = [newMemory, ...memories].slice(0, 50); // Keep max 50 memories
  saveMemories(updated);

  return newMemory;
}

export function deleteMemory(id: string): void {
  const memories = getMemories();
  const updated = memories.filter((m) => m.id !== id);
  saveMemories(updated);
}

export function togglePinMemory(id: string): void {
  const memories = getMemories();
  const updated = memories.map((m) =>
    m.id === id ? { ...m, pinned: !m.pinned } : m
  );
  saveMemories(updated);
}

export function clearMemories(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function getRecentMemories(limit = 10): MemoryItem[] {
  const memories = getMemories();
  return memories.slice(0, limit);
}
