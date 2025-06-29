import { DataSource, type IndexableDocument, type DataSourceOptions } from '../types.js';
import { parseLLMsTxt } from '../utils.js';
import { createHash } from 'crypto';

export interface URLOptions extends DataSourceOptions {
  /** URL to index */
  url: string;
  /** Maximum depth for crawling linked pages (future feature) */
  maxDepth?: number;
  /** Domains to restrict crawling to (future feature) */
  allowedDomains?: string[];
  /** Number of concurrent downloads (default: 5) */
  concurrency?: number;
  /** Delay between requests in milliseconds (default: 250) */
  delay?: number;
  /** Maximum number of files to process (default: undefined - process all files) */
  maxFiles?: number;
}

export class URLDataSource extends DataSource {
  private url: string;
  private options: URLOptions;
  private concurrency: number;
  private delay: number;
  private maxFiles?: number;

  constructor(options: URLOptions) {
    super('url');
    this.url = options.url;
    this.options = options;
    this.concurrency = options.concurrency ?? 5;
    this.delay = options.delay ?? 500;
    this.maxFiles = options.maxFiles;
  }

  async validate(): Promise<boolean> {
    try {
      // Basic URL validation
      new URL(this.url);
      // Check if URL ends with /llms.txt
      if (!this.url.endsWith('/llms.txt')) {
        console.error(`URL must end with /llms.txt: ${this.url}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Invalid URL: ${this.url}`, error);
      return false;
    }
  }

  async *discoverDocuments(options: DataSourceOptions = {}): AsyncGenerator<IndexableDocument, void, unknown> {
    try {
      // Fetch the llms.txt content from the source URL
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${this.url}: ${response.status} ${response.statusText}`);
      }
      
      const llmsTxtContent = await response.text();
      
      // Parse the llms.txt content
      const parsedContent = parseLLMsTxt(llmsTxtContent);
      
      // Collect all markdown links from all sections
      const markdownLinks: Array<{ url: string; title: string; sectionName: string; desc?: string }> = [];
      
      // Iterate through parsed sections and links
      for (const [sectionName, links] of Object.entries(parsedContent.sections)) {
        for (const link of links) {
          // Skip if link is undefined or missing required properties
          if (!link || !link.url || !link.title) {
            continue;
          }
          
          // Filter for markdown files (.md or .mdx)
          if (link.url.endsWith('.md') || link.url.endsWith('.mdx')) {
            markdownLinks.push({
              url: link.url,
              title: link.title,
              sectionName,
              desc: link.desc
            });
          }
        }
      }

      // Limit the number of files to process if maxFiles is set
      const filesToProcess = this.maxFiles
        ? markdownLinks.slice(0, this.maxFiles)
        : markdownLinks;
      
      if (this.maxFiles && markdownLinks.length > this.maxFiles) {
        console.log(`Limiting processing to ${this.maxFiles} files out of ${markdownLinks.length} found markdown files`);
      }

      // Download markdown files with concurrency control and yield results
      const downloadPromises: Promise<IndexableDocument | null>[] = [];
      let activeDownloads = 0;

      for (const markdownLink of filesToProcess) {
        // Wait if we've reached the concurrency limit
        while (activeDownloads >= this.concurrency) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Start download and track the promise
        activeDownloads++;
        const downloadPromise = this.downloadMarkdownFile(markdownLink).finally(() => {
          activeDownloads--;
        });
        
        downloadPromises.push(downloadPromise);

        // Add delay between starting downloads
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }

      // Yield documents as they complete
      for (const downloadPromise of downloadPromises) {
        try {
          const result = await downloadPromise;
          if (result) {
            yield result;
          }
        } catch (error) {
          // Error handling is already done in downloadMarkdownFile
          // Individual file failures don't stop the entire process
          console.error('Download failed:', error);
        }
      }
      
    } catch (error) {
      console.error(`Error fetching or parsing llms.txt from ${this.url}:`, error);
      throw error;
    }
  }

  /**
   * Download a single markdown file
   */
  private async downloadMarkdownFile(markdownLink: { url: string; title: string; sectionName: string; desc?: string }): Promise<IndexableDocument | null> {
    try {
      const response = await fetch(markdownLink.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      const contentHash = createHash('sha256').update(content).digest('hex');
      
      return {
        sourceUri: markdownLink.url,
        sourceType: 'url',
        content,
        contentHash,
        sectionName: markdownLink.sectionName,
        metadata: {
          title: markdownLink.title,
          description: markdownLink.desc,
        }
      };
    } catch (error) {
      console.error(`Failed to download ${markdownLink.url}:`, error);
      return null;
    }
  }

  /**
   * Get the URL for this data source
   */
  getUrl(): string {
    return this.url;
  }
} 