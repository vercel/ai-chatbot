import { firecrawl } from '@/lib/firecrawl';
import { tool } from 'ai';
import { z } from 'zod';

export const scrapeSite = tool({
  description:
    'Get the current HTML of a website to understand its contents (https://example.com)',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  execute: async ({ url }) => {
    try {
      const response = await firecrawl.scrape(url);
      return response;
    } catch (error) {
       throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
