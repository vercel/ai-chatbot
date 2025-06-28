import { DataSource, type IndexableDocument, type DataSourceOptions } from '../types.js';

export interface URLOptions extends DataSourceOptions {
  /** URL to index */
  url: string;
  /** Maximum depth for crawling linked pages (future feature) */
  maxDepth?: number;
  /** Domains to restrict crawling to (future feature) */
  allowedDomains?: string[];
}

export class URLDataSource extends DataSource {
  private url: string;
  private options: URLOptions;

  constructor(options: URLOptions) {
    super('url');
    this.url = options.url;
    this.options = options;
  }

  async validate(): Promise<boolean> {
    try {
      // Basic URL validation
      new URL(this.url);
      return true;
    } catch (error) {
      console.error(`Invalid URL: ${this.url}`, error);
      return false;
    }
  }

  async *discoverDocuments(options: DataSourceOptions = {}): AsyncGenerator<IndexableDocument, void, unknown> {
    throw new Error(
      'URL data source is not yet implemented. This feature will be available in a future release.'
    );
  }

  /**
   * Get the URL for this data source
   */
  getUrl(): string {
    return this.url;
  }
} 