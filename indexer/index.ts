#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import process from 'node:process';
import { 
  FileSystemDataSource, 
  URLDataSource, 
  GitHubDataSource,
  type FileSystemOptions,
  type URLOptions,
  type GitHubOptions
} from './data-sources/index.js';
import type { DataSource } from './types.js';

// Load environment variables
config();

interface IndexerOptions {
  path?: string;
  url?: string;
  repoUrl?: string;
}

async function main() {
  const program = new Command();

  program
    .name('indexer')
    .description('RAG Indexing Service - Index documents for vector search')
    .version('1.0.0');

  program
    .option('--path <directory>', 'Index local directory containing .md and .mdx files')
    .option('--url <url>', 'Index web page (placeholder for future implementation)')
    .option('--repo-url <github_url>', 'Index GitHub repository (placeholder for future implementation)')
    .action(async (options: IndexerOptions) => {
      // Validate mutually exclusive options
      const optionCount = [options.path, options.url, options.repoUrl].filter(Boolean).length;
      
      if (optionCount === 0) {
        console.error('Error: Must provide one of --path, --url, or --repo-url');
        process.exit(1);
      }
      
      if (optionCount > 1) {
        console.error('Error: Options --path, --url, and --repo-url are mutually exclusive');
        process.exit(1);
      }

      // Validate required environment variables
      if (!process.env.OPENAI_API_KEY) {
        console.error('Error: OPENAI_API_KEY environment variable is required');
        process.exit(1);
      }

      try {
        let dataSource: DataSource;

        if (options.path) {
          console.log(`🚀 Starting indexing for directory: ${options.path}`);
          dataSource = new FileSystemDataSource({ directoryPath: options.path } as FileSystemOptions);
        } else if (options.url) {
          console.log(`🌐 Starting indexing for URL: ${options.url}`);
          dataSource = new URLDataSource({ url: options.url } as URLOptions);
        } else if (options.repoUrl) {
          console.log(`📁 Starting indexing for GitHub repository: ${options.repoUrl}`);
          dataSource = new GitHubDataSource({ repoUrl: options.repoUrl } as GitHubOptions);
        } else {
          throw new Error('No valid data source provided');
        }

        await indexDataSource(dataSource);
      } catch (error) {
        console.error('❌ Indexing failed:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

async function indexDataSource(dataSource: DataSource): Promise<void> {
  try {
    // Validate the data source
    console.log('🔍 Validating data source...');
    const isValid = await dataSource.validate();
    if (!isValid) {
      throw new Error('Data source validation failed');
    }
    console.log('✅ Data source validation successful');

    // Discover documents
    console.log('📖 Discovering documents...');
    const documents = await dataSource.discoverDocuments({});
    
    if (documents.length === 0) {
      console.log('ℹ️  No documents found to index');
      return;
    }

    console.log(`📄 Found ${documents.length} documents to process`);
    
    // Log sample of discovered documents
    documents.slice(0, 5).forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.sourceUri} (${doc.sourceType}) - ${doc.content.length} chars`);
    });
    
    if (documents.length > 5) {
      console.log(`  ... and ${documents.length - 5} more documents`);
    }

    // Placeholder for actual indexing logic (will be implemented in task 4.0)
    console.log('🔄 Document processing and embedding generation will be implemented in task 4.0');
    
  } catch (error) {
    console.error(`Failed to index data source:`, error);
    throw error;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 