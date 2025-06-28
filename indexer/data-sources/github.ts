import { DataSource, type IndexableDocument, type DataSourceOptions } from '../types.js';

export interface GitHubOptions extends DataSourceOptions {
  /** GitHub repository URL (e.g., https://github.com/owner/repo) */
  repoUrl: string;
  /** Branch to index (defaults to main/master) */
  branch?: string;
  /** Paths to include (future feature) */
  includePaths?: string[];
  /** Paths to exclude (future feature) */
  excludePaths?: string[];
  /** GitHub API token for private repositories (future feature) */
  token?: string;
}

export class GitHubDataSource extends DataSource {
  private repoUrl: string;
  private options: GitHubOptions;

  constructor(options: GitHubOptions) {
    super('github');
    this.repoUrl = options.repoUrl;
    this.options = options;
  }

  async validate(): Promise<boolean> {
    try {
      // Basic GitHub URL validation
      const url = new URL(this.repoUrl);
      if (url.hostname !== 'github.com') {
        throw new Error('URL must be a GitHub repository');
      }
      
      // Check URL format: https://github.com/owner/repo
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        throw new Error('Invalid GitHub repository URL format');
      }
      
      return true;
    } catch (error) {
      console.error(`Invalid GitHub repository URL: ${this.repoUrl}`, error);
      return false;
    }
  }

  async discoverDocuments(options: DataSourceOptions = {}): Promise<IndexableDocument[]> {
    throw new Error(
      'GitHub data source is not yet implemented. This feature will be available in a future release.'
    );
  }

  /**
   * Get the repository URL for this data source
   */
  getRepoUrl(): string {
    return this.repoUrl;
  }

  /**
   * Extract owner and repository name from the URL
   */
  getOwnerAndRepo(): { owner: string; repo: string } {
    const url = new URL(this.repoUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  }
} 