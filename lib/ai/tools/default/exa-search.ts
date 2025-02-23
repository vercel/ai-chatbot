// lib/ai/tools/default/exa-search.ts
import { tool } from 'ai';
import { z } from 'zod';
import type { 
  SearchType, 
  Category,
  LivecrawlOption,
  ContentOptions,
  CommonRequestOptions,
  SearchResponse,
  AnswerResponse,
  SearchAndContentsOptions,
  SearchAndContentsResponse
} from '@/lib/types/exa';
import { getExaClient, ExaAPIError } from '@/lib/clients/exa';

// Zod schemas for validation
const searchTypeSchema = z.enum(['keyword', 'neural', 'auto'] as const) satisfies z.ZodType<SearchType>;
const categorySchema = z.enum([
  'company', 'research paper', 'news', 'pdf', 'github', 
  'tweet', 'personal site', 'linkedin profile', 'financial report'
] as const) satisfies z.ZodType<Category>;
const livecrawlOptionSchema = z.enum(['never', 'fallback', 'always', 'auto'] as const) satisfies z.ZodType<LivecrawlOption>;

const contentOptionsSchema = z.object({
  text: z.union([z.literal(true), z.object({
    maxCharacters: z.number().optional(),
    includeHtmlTags: z.boolean().optional()
  })]).optional(),
  highlights: z.union([z.literal(true), z.object({
    numSentences: z.number().optional(),
    highlightsPerUrl: z.number().optional(),
    query: z.string().optional()
  })]).optional(),
  summary: z.union([z.literal(true), z.object({
    query: z.string().optional()
  })]).optional(),
  livecrawl: livecrawlOptionSchema.optional(),
  livecrawlTimeout: z.number().optional(),
  subpages: z.number().optional(),
  subpageTarget: z.union([z.string(), z.array(z.string())]).optional(),
  extras: z.object({
    links: z.number().optional(),
    imageLinks: z.number().optional()
  }).optional()
}) satisfies z.ZodType<ContentOptions>;

const commonOptionsSchema = z.object({
  numResults: z.number().max(100).optional(),
  includeDomains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  startCrawlDate: z.string().optional(),
  endCrawlDate: z.string().optional(),
  startPublishedDate: z.string().optional(),
  endPublishedDate: z.string().optional(),
  includeText: z.array(z.string()).optional(),
  excludeText: z.array(z.string()).optional(),
  contents: contentOptionsSchema.optional()
}) satisfies z.ZodType<CommonRequestOptions>;

// Schema for the combined search and contents options
const searchAndContentsOptionsSchema = z.object({
  type: searchTypeSchema.optional(),
  category: categorySchema.optional(),
  useAutoprompt: z.boolean().optional(),
  moderation: z.boolean().optional(),
  // Content options at the top level
  text: z.union([z.literal(true), z.object({
    maxCharacters: z.number().optional(),
    includeHtmlTags: z.boolean().optional()
  })]).optional(),
  highlights: z.union([z.literal(true), z.object({
    numSentences: z.number().optional(),
    highlightsPerUrl: z.number().optional(),
    query: z.string().optional()
  })]).optional(),
  summary: z.union([z.literal(true), z.object({
    query: z.string().optional()
  })]).optional(),
  livecrawl: livecrawlOptionSchema.optional(),
  livecrawlTimeout: z.number().optional(),
  subpages: z.number().optional(),
  subpageTarget: z.union([z.string(), z.array(z.string())]).optional(),
  extras: z.object({
    links: z.number().optional(),
    imageLinks: z.number().optional()
  }).optional(),
  // Common options (excluding 'contents')
  numResults: z.number().max(100).optional(),
  includeDomains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  startCrawlDate: z.string().optional(),
  endCrawlDate: z.string().optional(),
  startPublishedDate: z.string().optional(),
  endPublishedDate: z.string().optional(),
  includeText: z.array(z.string()).optional(),
  excludeText: z.array(z.string()).optional()
}) satisfies z.ZodType<SearchAndContentsOptions>;

export const exaSearch = tool({
  description: "Perform a neural or keyword search using Exa's advanced search capabilities.",
  parameters: z.object({
    query: z.string().min(1).describe("The search query"),
    type: searchTypeSchema.optional().default('auto'),
    category: categorySchema.optional(),
    useAutoprompt: z.boolean().optional().default(true),
    options: commonOptionsSchema.optional()
  }),
  execute: async ({ query, type, category, useAutoprompt, options }): Promise<SearchResponse> => {
    try {
      const client = getExaClient();
      return await client.search(query, type, category, useAutoprompt, options);
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
  description: "Find similar content to a given URL using Exa.",
  parameters: z.object({
    url: z.string().url(),
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
    stream: z.boolean().optional().default(false),
    text: z.boolean().optional().default(false),
    model: z.enum(['exa', 'exa-pro']).optional().default('exa')
  }),
  execute: async ({ query, stream, text, model }): Promise<AnswerResponse> => {
    try {
      const client = getExaClient();
      return await client.answer(query, { stream, text, model });
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
