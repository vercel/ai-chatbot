// lib/ai/tools/default/exa-search.ts
import { tool } from 'ai';
import { z } from 'zod';
import type { 
  SearchResponse,
  AnswerResponse,
  SearchAndContentsResponse
} from '@/lib/types/exa';
import { 
  getExaClient, 
  ExaAPIError,
  searchOptionsSchema,
  answerOptionsSchema,
  searchAndContentsOptionsSchema,
  commonOptionsSchema,
  contentOptionsSchema
} from '@/lib/clients/exa';

export const exaSearch = tool({
  description: "Search the web for current, factual information. Best for: finding recent information, verifying claims, researching topics, or gathering data from multiple sources.",
  parameters: z.object({
    query: z.string().min(1).describe("The search query to find relevant information. Be specific and include key terms."),
    options: searchOptionsSchema.optional()
  }),
  execute: async ({ query, options }): Promise<SearchResponse> => {
    try {
      const client = getExaClient();
      return await client.search(query, options?.type, options?.category, options?.useAutoprompt, options);
    } catch (error) {
      console.error('Exa search error:', error);
      if (error instanceof ExaAPIError) {
        throw new Error(`Exa search failed: ${error.message}`);
      }
      throw new Error(`Failed to perform Exa search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const exaFindSimilar = tool({
  description: "Find content similar to a specific URL. Useful for discovering related articles, research, or competitive analysis.",
  parameters: z.object({
    url: z.string().url().describe("The source URL to find similar content for"),
    options: commonOptionsSchema.optional()
  }),
  execute: async ({ url, options }): Promise<SearchResponse> => {
    try {
      const client = getExaClient();
      return await client.findSimilar(url, options);
    } catch (error) {
      console.error('Exa findSimilar error:', error);
      if (error instanceof ExaAPIError) {
        throw new Error(`Exa findSimilar failed: ${error.message}`);
      }
      throw new Error(`Failed to find similar content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const exaGetContents = tool({
  description: "Retrieve and process content from specified URLs.",
  parameters: z.object({
    urls: z.array(z.string().url()),
    options: contentOptionsSchema.optional()
  }),
  execute: async ({ urls, options }): Promise<SearchResponse> => {
    try {
      const client = getExaClient();
      return await client.getContents(urls, options);
    } catch (error) {
      console.error('Exa getContents error:', error);
      if (error instanceof ExaAPIError) {
        throw new Error(`Exa getContents failed: ${error.message}`);
      }
      throw new Error(`Failed to get contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const exaAnswer = tool({
  description: "Generate an answer from search results using Exa.",
  parameters: z.object({
    query: z.string(),
    options: answerOptionsSchema.optional()
  }),
  execute: async ({ query, options }): Promise<AnswerResponse> => {
    try {
      const client = getExaClient();
      return await client.answer(query, options || {});
    } catch (error) {
      console.error('Exa answer error:', error);
      if (error instanceof ExaAPIError) {
        throw new Error(`Exa answer failed: ${error.message}`);
      }
      throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const exaSearchAndContents = tool({
  description: "Perform a search and retrieve content in a single call. Useful when you need both search results and their contents.",
  parameters: z.object({
    query: z.string().min(1).describe("The search query"),
    options: searchAndContentsOptionsSchema.optional()
  }),
  execute: async ({ query, options }): Promise<SearchAndContentsResponse> => {
    try {
      const client = getExaClient();
      return await client.searchAndContents(query, options);
    } catch (error) {
      console.error('Exa search and contents error:', error);
      if (error instanceof ExaAPIError) {
        throw new Error(`Exa search and contents failed: ${error.message}`);
      }
      throw new Error(`Failed to perform search and contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});
