import Firecrawl from '@mendable/firecrawl-js';

const firecrawlKey = process.env.FIRECRAWL_KEY

if(!firecrawlKey) {
    throw new Error("Firecrawl API Key missing")
}

export const firecrawl = new Firecrawl({ apiKey: firecrawlKey });