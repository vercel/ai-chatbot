'use server';

import { db } from '@/lib/db/queries';
import { suggestion } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getSuggestions({ documentId }: { documentId: string }) {
  try {
    // Query suggestions from PostgreSQL database
    const suggestions = await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));

    return suggestions ?? [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
