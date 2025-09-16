import { tool } from 'ai';
import { z } from 'zod';

const MEILISEARCH_URL = process.env.MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

if (!MEILISEARCH_URL) {
  throw new Error('MEILISEARCH_HOST is not defined');
}

if (!MEILISEARCH_API_KEY) {
  throw new Error('MEILISEARCH_API_KEY is not defined');
}

export const tireSearch = tool({
  description: `
Search for tires of the specified type using our API and return the results directly. 
For each tire, provide clear, detailed information including specifications, recommended usage, key benefits, and practical tips. 
Write the response in friendly, easy-to-read paragraphs, as if you are a knowledgeable SDR advising a client. 
Do not ask the user for confirmation or mention limitations—deliver the tire data immediately. 
Focus on actionable insights and practical guidance for each tire type, making the answer informative, consultative, and ready to use.
`,

  inputSchema: z.object({
    tireType: z.string(),
    dataStream: z.any().optional(),
  }),
  execute: async ({ tireType, dataStream }) => {
    const response = await fetch(`${MEILISEARCH_URL}/indexes/tires/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Meili-API-Key': MEILISEARCH_API_KEY,
      },
      body: JSON.stringify({ q: tireType, limit: 10 }),
    });

    if (!response.ok) {
      throw new Error(
        `Meilisearch request failed: ${response.status} ${response.statusText}`,
      );
    }

    const tireData = await response.json();

    // If dataStream is provided, send results in streaming
    if (dataStream && typeof dataStream.write === 'function') {
      for (const tire of tireData.hits) {
        dataStream.write(JSON.stringify(tire));
      }
      dataStream.end?.();
    }

    return tireData.hits;
  },
});
