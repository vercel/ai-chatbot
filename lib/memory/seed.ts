import type { MemoryItem } from "./storage";

/**
 * Seed memories to demonstrate the memory system
 * These are added on first load if no memories exist
 */
export const SEED_MEMORIES: Omit<MemoryItem, "id">[] = [
  {
    content: "Focus on Q4 strategic partnerships with health systems",
    source: "chat",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    pinned: true,
  },
  {
    content: "Emphasize health outcomes leading to cost savings in pitch narrative",
    source: "chat",
    timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), // 19 days ago (10/19/2025)
    pinned: false,
  },
  {
    content: "Preparing Glen AI demo for healthcare innovation conference",
    source: "avatar",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    pinned: false,
  },
];
