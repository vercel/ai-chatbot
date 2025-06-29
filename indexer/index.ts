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
import type { DataSource, IndexableDocument } from './types.js';
import {
  splitDocumentIntoChunks,
  generateEmbeddingsBatch,
  shouldReindexDocument,
} from './utils.js';
import {
  getResourceBySourceUri,
  createResource,
  updateResourceContentHash,
  deleteResource,
  createResourceChunks,
  deleteResourceChunksByResourceId,
  getResourcesBySourceType,
} from './db.js';

// Load environment variables
config();

interface IndexerOptions {
  path?: string;
  url?: string;
  repoUrl?: string;
  // URL data source specific options
  maxFiles?: number;
  concurrency?: number;
  delay?: number;
}

async function main() {  
  const program = new Command();

  program
    .name('indexer')
    .description('RAG Indexing Service - Index documents for vector search')
    .version('1.0.0');

  program
    .option('--path <directory>', 'Index local directory containing .md and .mdx files')
    .option('--url <url>', 'Index URL pointing to llms.txt file')
    .option('--repo-url <github_url>', 'Index GitHub repository (placeholder for future implementation)')
    .option('--max-files <number>', 'Maximum number of files to process from URL source (default: process all)', (value) => parseInt(value, 10))
    .option('--concurrency <number>', 'Number of concurrent downloads for URL source (default: 5)', (value) => parseInt(value, 10))
    .option('--delay <number>', 'Delay between requests in milliseconds for URL source (default: 250)', (value) => parseInt(value, 10))
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

      // Validate URL-specific options are only used with --url
      const urlSpecificOptions = [options.maxFiles, options.concurrency, options.delay].filter(opt => opt !== undefined);
      if (urlSpecificOptions.length > 0 && !options.url) {
        console.error('Error: Options --max-files, --concurrency, and --delay can only be used with --url');
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
          
          // Build URL options with all configured parameters
          const urlOptions: URLOptions = {
            url: options.url,
            ...(options.maxFiles && { maxFiles: options.maxFiles }),
            ...(options.concurrency && { concurrency: options.concurrency }),
            ...(options.delay && { delay: options.delay })
          };
          
          // Log configured options
          const configuredOptions = [];
          if (options.maxFiles) configuredOptions.push(`maxFiles: ${options.maxFiles}`);
          if (options.concurrency) configuredOptions.push(`concurrency: ${options.concurrency}`);
          if (options.delay) configuredOptions.push(`delay: ${options.delay}ms`);
          
          if (configuredOptions.length > 0) {
            console.log(`   ⚙️  Configuration: ${configuredOptions.join(', ')}`);
          }
          
          dataSource = new URLDataSource(urlOptions);
        } else if (options.repoUrl) {
          console.log(`📁 Starting indexing for GitHub repository: ${options.repoUrl}`);
          dataSource = new GitHubDataSource({ repoUrl: options.repoUrl } as GitHubOptions);
        } else {
          throw new Error('No valid data source provided');
        }

        await indexDataSource(dataSource);
        process.exit(0);
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

    // Process documents one-by-one using the generator
    console.log('📖 Discovering and processing documents...');
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const discoveredUris = new Set<string>(); // Track discovered document URIs for deletion handling

    for await (const document of dataSource.discoverDocuments({})) {
      discoveredUris.add(document.sourceUri);
      
      try {
        const wasProcessed = await processDocument(document);
        if (wasProcessed) {
          processedCount++;
        } else {
          skippedCount++;
        }

        // Log progress every 10 documents
        const totalProcessed = processedCount + skippedCount + errorCount;
        if (totalProcessed % 10 === 0 && totalProcessed > 0) {
          console.log(`📄 Processed ${totalProcessed} documents (${processedCount} updated, ${skippedCount} skipped)...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process document ${document.sourceUri}:`, error);
        // Continue processing other documents
      }
    }
    
    const totalDocuments = processedCount + skippedCount + errorCount;
    
    if (totalDocuments === 0) {
      console.log('ℹ️  No documents found to index');
      return;
    }

    // Handle deletion of documents that no longer exist (for file system sources)
    if (dataSource.getSourceType() === 'file') {
      await handleDocumentDeletion(dataSource.getSourceType(), discoveredUris);
    }

    console.log(`✅ Indexing completed!`);
    console.log(`   📄 Total found: ${totalDocuments} documents`);
    console.log(`   🔄 Processed: ${processedCount} documents`);
    console.log(`   ⏭️  Skipped: ${skippedCount} documents (no changes)`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} documents`);
    }
    
  } catch (error) {
    console.error(`Failed to index data source:`, error);
    throw error;
  }
}

/**
 * Process a single document: check if it needs reindexing, chunk it, generate embeddings, and store in database
 */
async function processDocument(document: IndexableDocument): Promise<boolean> {
  // Check if document already exists in database
  const existingResource = await getResourceBySourceUri(document.sourceUri);
  
  // Check if document needs to be reindexed
  if (existingResource && !shouldReindexDocument(existingResource.contentHash, document.contentHash)) {
    // Document hasn't changed, skip processing
    return false;
  }

  console.log(`🔄 Processing document: ${document.sourceUri}`);

  // Split document into chunks
  const chunks = await splitDocumentIntoChunks(document);
  console.log(`   📝 Split into ${chunks.length} chunks`);

  // Generate embeddings for all chunks
  console.log(`   🧠 Generating embeddings...`);
  const chunksWithEmbeddings = await generateEmbeddingsBatch(chunks);

  // Store or update in database
  if (existingResource) {
    // Update existing resource
    console.log(`   💾 Updating existing resource in database...`);
    
    // Delete existing chunks
    await deleteResourceChunksByResourceId(existingResource.id);
    
    // Update resource content hash
    await updateResourceContentHash({
      id: existingResource.id,
      contentHash: document.contentHash,
    });
    
    // Create new chunks
    await createResourceChunks({
      resourceId: existingResource.id,
      chunksWithEmbeddings,
    });
  } else {
    // Create new resource
    console.log(`   💾 Creating new resource in database...`);
    
    const newResource = await createResource({
      sourceType: document.sourceType,
      sourceUri: document.sourceUri,
      contentHash: document.contentHash,
    });
    
    // Create chunks
    await createResourceChunks({
      resourceId: newResource.id,
      chunksWithEmbeddings,
    });
  }

  return true;
}

/**
 * Handle deletion of documents that no longer exist in the data source
 */
async function handleDocumentDeletion(sourceType: 'file' | 'url' | 'github', discoveredUris: Set<string>): Promise<void> {
  console.log('🗑️  Checking for deleted documents...');
  
  // Get all existing resources of this source type
  const existingResources = await getResourcesBySourceType(sourceType);
  
  // Find resources that no longer exist in the discovered documents
  const resourcesToDelete = existingResources.filter(resource => !discoveredUris.has(resource.sourceUri));
  
  if (resourcesToDelete.length > 0) {
    console.log(`🗑️  Deleting ${resourcesToDelete.length} documents that no longer exist...`);
    
    for (const resource of resourcesToDelete) {
      try {
        await deleteResource(resource.id);
        console.log(`   🗑️  Deleted: ${resource.sourceUri}`);
      } catch (error) {
        console.error(`❌ Failed to delete resource ${resource.sourceUri}:`, error);
      }
    }
  } else {
    console.log('✅ No deleted documents found');
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