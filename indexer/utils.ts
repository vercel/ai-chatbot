import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import type { DocumentChunk, Embedding, IndexableDocument } from './types.js';

const embeddingModel = openai.textEmbeddingModel('text-embedding-ada-002');

/**
 * Configuration for text chunking
 */
export const CHUNK_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
};

/**
 * Split document content into chunks using recursive character text splitter
 */
export async function splitDocumentIntoChunks(document: IndexableDocument): Promise<DocumentChunk[]> {
  const textSplitter = new MarkdownTextSplitter({
    chunkSize: CHUNK_CONFIG.chunkSize,
    chunkOverlap: CHUNK_CONFIG.chunkOverlap,
  });

  try {
    const chunks = await textSplitter.createDocuments([document.content]);
    
    return chunks.map((chunk, index) => ({
      content: chunk.pageContent,
      startIndex: index * (CHUNK_CONFIG.chunkSize - CHUNK_CONFIG.chunkOverlap),
      endIndex: index * (CHUNK_CONFIG.chunkSize - CHUNK_CONFIG.chunkOverlap) + chunk.pageContent.length,
    }));
  } catch (error) {
    console.error(`Failed to split document ${document.sourceUri}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a text chunk
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    });
    
    return embedding;
  } catch (error) {
    console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 */
export async function generateEmbeddingsBatch(chunks: DocumentChunk[]): Promise<Array<[DocumentChunk, Embedding]>> {
  try {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map(chunk => chunk.content),
    });
    
    return chunks.map((chunk, index): [DocumentChunk, Embedding] => [
      chunk,
      embeddings[index],
    ]);
  } catch (error) {
    console.error('Failed to generate embeddings batch:', error);
    throw error;
  }
}

/**
 * Check if a document needs to be reindexed based on content hash
 */
export function shouldReindexDocument(
  existingContentHash: string | null, 
  newContentHash: string
): boolean {
  return existingContentHash !== newContentHash;
}
