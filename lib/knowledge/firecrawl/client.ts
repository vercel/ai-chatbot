/**
 * Simple client for Firecrawl web content extraction API
 */
export class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.firecrawl.dev/v1/scrape';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FIRECRAWL_API_KEY not provided or found in environment variables');
    }
  }

  /**
   * Scrape content from a URL using Firecrawl API
   */
  async scrapeUrl(url: string): Promise<ScrapeResult> {
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for scraping');
    }

    console.log(`Sending scrape request to ${this.baseUrl} with URL: ${url}`);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url: url
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch content from firecrawl.dev: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error using FirecrawlClient:', error);
      throw error;
    }
  }
}

export interface ScrapeResult {
  url: string;
  title?: string;
  content?: string;
  markdown?: string;
  text?: string;
  html?: string;
  metadata?: {
    description?: string;
    author?: string;
    siteName?: string;
    publishedDate?: string;
    modifiedDate?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Default export as a singleton
const firecrawlClient = new FirecrawlClient();
export default firecrawlClient;