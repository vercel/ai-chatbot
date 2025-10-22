import type { MemoryItem } from './storage';

/**
 * Seed memories to demonstrate the memory system
 * These are added on first load if no memories exist
 */
export const SEED_MEMORIES: Omit<MemoryItem, 'id'>[] = [
  {
    content: 'Strategic partnerships focus for Q4',
    category: 'topic',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    pinned: true,
  },
  {
    content: 'Health outcomes → cost savings narrative',
    category: 'decision',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    pinned: false,
  },
  {
    content: 'AI twin demo narrative for conference',
    category: 'followup',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    pinned: false,
  },
];
