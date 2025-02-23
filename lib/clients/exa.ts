import Exa from 'exa-js';
import type { 
  SearchResponse,
  SearchType,
  Category,
  ContentOptions,
  FindSimilarOptions,
  AnswerOptions,
  AnswerResponse,
  SearchAndContentsOptions,
  SearchAndContentsResponse
} from '@/lib/types/exa';

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
    try {
      const response = await this.client.search(query, {
        type,
        category,
        useAutoprompt,
        ...options
      });
      return response as SearchResponse;
    } catch (error) {
      console.error('Exa search error:', error);
      throw new ExaAPIError(
        'Failed to perform Exa search',
        error instanceof Error ? undefined : 500,
        error
      );
    }
  }

  async findSimilar(
    url: string,
    options?: FindSimilarOptions
  ): Promise<SearchResponse> {
    try {
      const response = await this.client.findSimilar(url, options);
      return response as SearchResponse;
    } catch (error) {
      console.error('Exa findSimilar error:', error);
      throw new ExaAPIError(
        'Failed to find similar content',
        error instanceof Error ? undefined : 500,
        error
      );
    }
  }

  async getContents(
    urls: string[],
    options?: ContentOptions
  ): Promise<SearchResponse> {
    try {
      const response = await this.client.getContents(urls, options);
      return response as SearchResponse;
    } catch (error) {
      console.error('Exa getContents error:', error);
      throw new ExaAPIError(
        'Failed to get contents',
        error instanceof Error ? undefined : 500,
        error
      );
    }
  }

  async answer(
    query: string,
    options: AnswerOptions
  ): Promise<AnswerResponse> {
    try {
      const response = await this.client.answer(query, options);
      return response as AnswerResponse;
    } catch (error) {
      console.error('Exa answer error:', error);
      throw new ExaAPIError(
        'Failed to generate answer',
        error instanceof Error ? undefined : 500,
        error
      );
    }
  }

  async searchAndContents(
    query: string,
    options?: SearchAndContentsOptions
  ): Promise<SearchAndContentsResponse> {
    try {
      const response = await this.client.searchAndContents(query, options);
      return response as SearchAndContentsResponse;
    } catch (error) {
      console.error('Exa search and contents error:', error);
      throw new ExaAPIError(
        'Failed to perform search and contents',
        error instanceof Error ? undefined : 500,
        error
      );
    }
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