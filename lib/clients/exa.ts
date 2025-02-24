import Exa from 'exa-js';
import { z } from 'zod';
import type { 
  SearchResponse,
  SearchType,
  Category,
  LivecrawlOption,
  ContentOptions,
  FindSimilarOptions,
  AnswerOptions,
  AnswerResponse,
  SearchAndContentsOptions,
  SearchAndContentsResponse
} from '@/lib/types/exa';

// Base schemas for common types
export const searchTypeSchema = z.enum(['keyword', 'neural', 'auto'] as const)
  .describe('The type of search to perform. Use "neural" for semantic search, "keyword" for exact matches, or "auto" to let Exa decide.')
  .default('auto');

export const categorySchema = z.enum([
  'company', 'research paper', 'news', 'pdf', 'github', 
  'tweet', 'personal site', 'linkedin profile', 'financial report'
] as const) satisfies z.ZodType<Category>;

export const livecrawlOptionSchema = z.enum(['never', 'fallback', 'always', 'auto'] as const)
  .describe('Controls when to crawl live content: "never" to use cache only, "fallback" for cache with live fallback, "always" to force live crawl, or "auto" to let Exa decide.');

// Content-related schemas
export const textOptionsSchema = z.union([
  z.literal(true),
  z.object({
    maxCharacters: z.number().optional()
      .describe('Maximum number of characters to include in the text content'),
    includeHtmlTags: z.boolean().optional()
      .describe('Whether to preserve HTML tags in the extracted text')
  })
]).describe('If provided, includes the full text of the content in the results');

export const highlightsOptionsSchema = z.union([
  z.literal(true),
  z.object({
    numSentences: z.number().optional()
      .describe('Number of sentences to include in each highlight'),
    highlightsPerUrl: z.number().optional()
      .describe('Number of highlight sections to return per URL'),
    query: z.string().optional()
      .describe('Custom query to use for generating highlights, defaults to search query')
  })
]).describe('If provided, includes relevant highlights of the content in the results');

export const summaryOptionsSchema = z.union([
  z.literal(true),
  z.object({
    query: z.string().optional()
      .describe('Query to focus the summary on')
  })
]).describe('Text summarization options');

export const extrasOptionsSchema = z.object({
  links: z.number().optional()
    .describe('Number of links to extract'),
  imageLinks: z.number().optional()
    .describe('Number of image links to extract')
}).describe('Additional content extraction options');

// Combined content options schema
export const contentOptionsSchema = z.object({
  text: textOptionsSchema.optional(),
  highlights: highlightsOptionsSchema.optional(),
  summary: summaryOptionsSchema.optional(),
  livecrawl: livecrawlOptionSchema.optional(),
  livecrawlTimeout: z.number().optional()
    .describe('Timeout in milliseconds for live crawling'),
  subpages: z.number().optional()
    .describe('Number of subpages to crawl'),
  subpageTarget: z.union([z.string(), z.array(z.string())]).optional()
    .describe('Target path(s) for subpage crawling'),
  extras: extrasOptionsSchema.optional()
}).describe('Content retrieval and processing options');

// Common request options schema
export const commonOptionsSchema = z.object({
  numResults: z.number().max(100).optional()
    .describe('Number of search results to return')
    .default(10),
  includeDomains: z.array(z.string()).optional()
    .describe('List of specific domain names to include (e.g., ["europa.eu", "ec.europa.eu"]). Must be valid domain names, not descriptions.'),
  excludeDomains: z.array(z.string()).optional()
    .describe('List of specific domain names to exclude (e.g., ["twitter.com", "facebook.com"]). Must be valid domain names, not descriptions.'),
  startCrawlDate: z.string().optional()
    .describe('Results will only include links crawled after this date (format: YYYY-MM-DD)'),
  endCrawlDate: z.string().optional()
    .describe('Results will only include links crawled before this date (format: YYYY-MM-DD)'),
  startPublishedDate: z.string().optional()
    .describe('Results will only include links with a published date after this date (format: YYYY-MM-DD)'),
  endPublishedDate: z.string().optional()
    .describe('Results will only include links with a published date before this date (format: YYYY-MM-DD)'),
  includeText: z.array(z.string()).optional()
    .describe('List of text strings that must be present in the results. Use for exact text matching.'),
  excludeText: z.array(z.string()).optional()
    .describe('List of text strings that must not be present in the results. Use for exact text matching.'),
  contents: contentOptionsSchema.optional()
    .describe('Options for content retrieval')
}).describe('Common options for search and retrieval. Note: Domain filters must use valid domain names (e.g., "example.com"), not descriptive terms.');

// Search-specific schemas
export const searchOptionsSchema = commonOptionsSchema.extend({
  type: searchTypeSchema.optional(),
  category: categorySchema.optional(),
  useAutoprompt: z.boolean().optional()
    .describe('If true, convert query to a query best suited for Exa')
    .default(false),
}).describe('Options for search operations');

// Answer-specific schemas
export const answerOptionsSchema = z.object({
  stream: z.boolean().optional().default(false)
    .describe('Whether to stream the response'),
  text: z.boolean().optional().default(false)
    .describe('Whether to include source text'),
  model: z.enum(['exa', 'exa-pro']).optional().default('exa')
    .describe('Model to use for generating the answer')
}).describe('Options for answer generation');

// Combined search and contents schema
export const searchAndContentsOptionsSchema = z.object({
  ...commonOptionsSchema.shape,
  type: searchTypeSchema.optional(),
  category: categorySchema.optional(),
  useAutoprompt: z.boolean().optional(),
  moderation: z.boolean().optional(),
  text: textOptionsSchema.optional(),
  highlights: highlightsOptionsSchema.optional(),
  summary: summaryOptionsSchema.optional(),
  livecrawl: livecrawlOptionSchema.optional(),
  livecrawlTimeout: z.number().optional(),
  subpages: z.number().optional(),
  subpageTarget: z.union([z.string(), z.array(z.string())]).optional(),
  extras: extrasOptionsSchema.optional()
}).describe('Options for combined search and content retrieval');

// Custom error for Exa API issues
export class ExaAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ExaAPIError';
  }
}

// Configuration validation
function validateConfig() {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'EXA_API_KEY environment variable is not set. Please add it to your .env file.'
    );
  }
  return {
    apiKey,
    baseUrl: process.env.EXA_API_BASE_URL || 'https://api.exa.ai'
  };
}

export class ExaClient {
  private client: Exa;
  private static instance: ExaClient;

  private constructor() {
    const config = validateConfig();
    this.client = new Exa(config.apiKey);
  }

  public static getInstance(): ExaClient {
    if (!ExaClient.instance) {
      ExaClient.instance = new ExaClient();
    }
    return ExaClient.instance;
  }

  private logRequest(method: string, params: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    console.log('=== Exa API Request ===');
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Method: ${method}`);
    console.log('Parameters:', JSON.stringify(params, null, 2));
  }

  private logResponse(method: string, response: unknown, duration: number) {
    console.log('=== Exa API Response ===');
    console.log(`Method: ${method}`);
    console.log(`Duration: ${duration}ms`);
    console.log('Response:', JSON.stringify(response, null, 2));
  }

  private async executeWithLogging<T>(
    method: string,
    operation: () => Promise<T>,
    params: Record<string, unknown>
  ): Promise<T> {
    this.logRequest(method, params);
    const startTime = Date.now();
    
    try {
      const response = await operation();
      const duration = Date.now() - startTime;
      this.logResponse(method, response, duration);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`=== Exa API Error ===\nMethod: ${method}\nDuration: ${duration}ms\nError:`, error);
      throw error;
    }
  }

  async search(
    query: string,
    type?: SearchType,
    category?: Category,
    useAutoprompt?: boolean,
    options?: {
      contents?: ContentOptions;
      [key: string]: unknown;
    }
  ): Promise<SearchResponse> {
    return this.executeWithLogging(
      'search',
      async () => {
        const response = await this.client.search(query, {
          type,
          category,
          useAutoprompt,
          ...options
        });
        return response as unknown as SearchResponse;
      },
      { query, type, category, useAutoprompt, options }
    );
  }

  async findSimilar(
    url: string,
    options?: FindSimilarOptions
  ): Promise<SearchResponse> {
    return this.executeWithLogging(
      'findSimilar',
      async () => {
        const response = await this.client.findSimilar(url, options);
        return response as unknown as SearchResponse;
      },
      { url, options }
    );
  }

  async getContents(
    urls: string[],
    options?: ContentOptions
  ): Promise<SearchResponse> {
    return this.executeWithLogging(
      'getContents',
      async () => {
        const response = await this.client.getContents(urls, options);
        return response as unknown as SearchResponse;
      },
      { urls, options }
    );
  }

  async answer(
    query: string,
    options: AnswerOptions
  ): Promise<AnswerResponse> {
    return this.executeWithLogging(
      'answer',
      async () => {
        const response = await this.client.answer(query, options);
        // Ensure requestId is always present
        return {
          ...response,
          requestId: response.requestId || ''
        } as AnswerResponse;
      },
      { query, options }
    );
  }

  async searchAndContents(
    query: string,
    options?: SearchAndContentsOptions
  ): Promise<SearchAndContentsResponse> {
    return this.executeWithLogging(
      'searchAndContents',
      async () => {
        const response = await this.client.searchAndContents(query, options);
        return response as unknown as SearchAndContentsResponse;
      },
      { query, options }
    );
  }
}

// Export a function to get the client instance
let exaClient: ExaClient | null = null;

export function getExaClient(): ExaClient {
  if (!exaClient) {
    exaClient = ExaClient.getInstance();
  }
  return exaClient;
} 