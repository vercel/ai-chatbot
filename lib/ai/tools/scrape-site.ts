import { firecrawl } from '@/lib/firecrawl';
import { tool } from 'ai';
import { z } from 'zod';

export const scrapeSite = tool({
    description: "Get the current HTML of a website to understand its contents (HTTPS://example.com)",
    inputSchema: z.object({
         url: z.string().url()
    }),
    execute: async ({ url }) => {
    const response = firecrawl.scrape(url);
    const scrapedData = await response;
    return scrapedData;
  },
})