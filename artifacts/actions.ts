'use server';

import { db } from '@/lib/firebase/admin';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function getSuggestions({ documentId }: { documentId: string }) {
  try {
    // Query suggestions collection for matches with the given documentId
    const suggestionsRef = collection(db, 'suggestions');
    const q = query(suggestionsRef, where('documentId', '==', documentId));
    const querySnapshot = await getDocs(q);

    // Transform the query results into an array of suggestions
    const suggestions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return suggestions ?? [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
