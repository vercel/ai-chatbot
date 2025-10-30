"use server";

// Stateless: Suggestions managed client-side
export async function getSuggestions({ documentId }: { documentId: string }) {
  // Stateless: Suggestions are managed client-side, return empty array
  return [];
}
