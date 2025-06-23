'use server';

import type { Suggestion } from '@ai-chat/lib/types';

const suggestions: Suggestion[] = [
  {
    documentId: 'asdasd',
    id: 'asdasd',
    createdAt: new Date(),
    userId: 'asdasd',
    documentCreatedAt: new Date(),
    originalText: 'asdasd',
    suggestedText: 'asdasd',
    description: 'asdasd',
    isResolved: false,
  },
  {
    documentId: 'asdasd',
    id: 'asdasd',
    createdAt: new Date(),
    userId: 'asdasd',
    documentCreatedAt: new Date(),
    originalText: 'asdasd',
    suggestedText: 'asdasd',
    description: 'asdasd',
    isResolved: false,
  },
];

export async function getSuggestions({ documentId }: { documentId: string }) {
  return suggestions ?? [];
}
