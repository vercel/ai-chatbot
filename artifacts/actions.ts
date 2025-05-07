import { apiClient } from '@/lib/api-client';

export async function getSuggestions({ documentId }: { documentId: string }) {
  try {
    const suggestions = await apiClient.getSuggestionsByDocument(documentId);
    return suggestions ?? [];
  } catch (error) {
    console.error('Failed to get suggestions:', error);
    return [];
  }
}
