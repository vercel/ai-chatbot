import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DataSource, type IndexableDocument, type DataSourceOptions } from '../types.js';

export interface FileSystemOptions extends DataSourceOptions {
  /** Root directory path to scan for markdown files */
  directoryPath: string;
  /** File extensions to include (defaults to .md and .mdx) */
  extensions?: string[];
}

export class FileSystemDataSource extends DataSource {
  private directoryPath: string;
  private extensions: string[];

  constructor(options: FileSystemOptions) {
    super('file');
    this.directoryPath = path.resolve(options.directoryPath);
    this.extensions = options.extensions || ['.md', '.mdx'];
  }

  async validate(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.directoryPath);
      return stats.isDirectory();
    } catch (error) {
      console.error(`Directory validation failed: ${error}`);
      return false;
    }
  }

  async *discoverDocuments(options: DataSourceOptions = {}): AsyncGenerator<IndexableDocument, void, unknown> {
    try {
      for await (const filePath of this.findMarkdownFiles(this.directoryPath)) {
        try {
          const document = await this.processFile(filePath);
          yield document;
        } catch (error) {
          console.warn(`Failed to process file ${filePath}:`, error);
          // Continue processing other files
        }
      }
    } catch (error) {
      console.error(`Failed to discover documents in ${this.directoryPath}:`, error);
      throw error;
    }
  }

  private async *findMarkdownFiles(directory: string): AsyncGenerator<string, void, unknown> {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          yield* this.findMarkdownFiles(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.extensions.includes(ext)) {
            yield fullPath;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${directory}:`, error);
      throw error;
    }
  }

  private async processFile(filePath: string): Promise<IndexableDocument> {
    try {
      // Read file content and stats
      const [content, stats] = await Promise.all([
        fs.readFile(filePath, 'utf-8'),
        fs.stat(filePath),
      ]);

      // Generate content hash
      const contentHash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

      // Create relative path from the base directory for consistent URIs
      const relativePath = path.relative(this.directoryPath, filePath);
      const sourceUri = relativePath.replace(/\\/g, '/'); // Normalize path separators

      // Extract title from filename (without extension)
      const title = path.basename(filePath, path.extname(filePath));

      return {
        sourceUri,
        sourceType: 'file',
        content,
        contentHash,
        metadata: {
          title,
          lastModified: stats.mtime,
          fileSize: stats.size,
          fullPath: filePath,
          extension: path.extname(filePath),
        },
      };
    } catch (error) {
      console.error(`Failed to process file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get the base directory path for this data source
   */
  getDirectoryPath(): string {
    return this.directoryPath;
  }

  /**
   * Get the supported file extensions
   */
  getSupportedExtensions(): string[] {
    return [...this.extensions];
  }
} 