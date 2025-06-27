#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import process from 'node:process';

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
        if (options.path) {
          console.log(`🚀 Starting indexing for directory: ${options.path}`);
          await indexDirectory(options.path);
        } else if (options.url) {
          console.log(`🌐 URL indexing not yet implemented: ${options.url}`);
          console.log('This feature will be available in a future release.');
        } else if (options.repoUrl) {
          console.log(`📁 GitHub repository indexing not yet implemented: ${options.repoUrl}`);
          console.log('This feature will be available in a future release.');
        }
      } catch (error) {
        console.error('❌ Indexing failed:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

async function indexDirectory(directoryPath: string): Promise<void> {
  // Placeholder for directory indexing logic
  // This will be implemented in later tasks
  console.log(`📂 Processing directory: ${directoryPath}`);
  console.log('🔄 Directory indexing logic will be implemented in task 4.0');
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