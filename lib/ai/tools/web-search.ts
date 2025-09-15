import { firecrawl } from '@/lib/firecrawl';
import { tool } from 'ai';
import { z } from 'zod';

export const searchWeb = tool({
    description: "Search the web for any query",
    inputSchema: z.object({
        query: z.string()
    }),
    execute: async ({ query }) => {
    const response = firecrawl.search(query, {
        scrapeOptions: { formats: ['markdown'] }
    });
    const resultData = await response;
    return resultData;
  },
})