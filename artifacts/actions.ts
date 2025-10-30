"use server";

// Stateless: Suggestions managed client-side
export async function getSuggestions(_params: { documentId: string }) {
  // Stateless: Suggestions are managed client-side, return empty array
  await Promise.resolve();
  return [];
}
