export interface KbSnippet {
  snippet: string;
}

/**
 * Simple knowledge base search stub returning canned snippets.
 */
export async function kb_search(query: string): Promise<KbSnippet[]> {
  return [
    { snippet: `Informação sobre: ${query}` },
  ];
}
