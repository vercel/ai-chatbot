import { embed, tool } from 'ai';
import { z } from 'zod';
import { searchSimilarChunks } from '@/lib/db/queries';
import { myProvider } from '../providers';

export const searchKnowledge = tool({
  description: 'Search for relevant information in the knowledge base using a natural language query',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant information'),
  }),
  execute: async ({ query }) => {
    try {
      // Generate embedding for the search query
      const { embedding } = await embed({
        model: myProvider.textEmbeddingModel('embedding-model'),
        value: query,
      });

      // Search for similar chunks in the knowledge base
      const results = await searchSimilarChunks({ embedding });

      if (results.length === 0) {
        return {
          resultType: 'knowledgeBaseResults',
          message: 'No relevant information found in the knowledge base.',
          results: [],
        };
      }

      const formattedResults = results.map((result, index) => ({
        rank: index + 1,
        content: result.chunkContent,
        source: result.resourceUri,
        sourceType: result.resourceType,
        similarity: result.similarity,
      }));

      return {
        resultType: 'knowledgeBaseResults',
        results: formattedResults,
      };
    } catch (error) {
      console.error('Knowledge search error:', error);
      return {
        resultType: 'knowledgeBaseResults',
        message: 'An error occurred while searching the knowledge base.',
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      };
    }
  },
});
