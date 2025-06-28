import { embed, embedMany } from 'ai';
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { DocumentChunk, Embedding, IndexableDocument } from './types.js';
import { myProvider } from '@/lib/ai/providers.js';

export const DEFAULT_CHUNK_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
};

/**
 * Split document content into chunks using markdown text splitter
 */
export async function splitDocumentIntoChunks(
  document: IndexableDocument,
  options?: { chunkSize?: number; chunkOverlap?: number; separators?: string[] }
): Promise<DocumentChunk[]> {

  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_CONFIG.chunkSize;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_CONFIG.chunkOverlap;
  const separators = options?.separators ?? DEFAULT_CHUNK_CONFIG.separators;
 
  const isMarkdownDoc = document.sourceUri.endsWith('.md') || document.sourceUri.endsWith('.mdx');

  const textSplitter = isMarkdownDoc
    ? new MarkdownTextSplitter({ chunkSize, chunkOverlap })
    : new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap, separators });

  try {
    const chunks = await textSplitter.createDocuments([document.content]);
    
    return chunks.map((chunk, index) => ({
      content: chunk.pageContent,
      startIndex: index * (chunkSize - chunkOverlap),
      endIndex: index * (chunkSize - chunkOverlap) + chunk.pageContent.length,
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
      model: myProvider.textEmbeddingModel('embedding-model'),
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
