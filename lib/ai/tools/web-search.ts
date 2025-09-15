import { firecrawl } from '@/lib/firecrawl';
import { tool } from 'ai';
import { z } from 'zod';

export const searchWeb = tool({
  description: 'Search the web for any query',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    try {
      const response = await firecrawl.search(query, {
        scrapeOptions: { formats: ['markdown'] },
      });
      return response;
    } catch (error) {
        throw new Error(`Failed to search the web: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
