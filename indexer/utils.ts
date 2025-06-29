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
      model: myProvider.textEmbeddingModel('embedding-model'),
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

/**
 * Parse the content of an llms.txt file
 * 
 * @param txt - The content of an llms.txt file
 * @returns An object with the parsed content
 * @example
 * Example input:
 * ```
# Title

> Optional description goes here

Optional details go here

## Section name

- [Link title](https://link_url): Optional link details

## Optional

- [Link title](https://link_url)
 * ```
 * Example response:
 * ```
{
  "title": "Title",
  "summary": "Optional description goes here",
  "info": "Optional details go here",
  "sections": {
    "Section name": [
      {
        "title": "Link title",
        "url": "https://link_url",
        "desc": "Optional link details"
      }
    ],
    "Optional": [
      {
        "title": "Link title",
        "url": "https://link_url"
      }
    ]
  }
} 
 * ```
 */
export function parseLLMsTxt(txt: string) {
  function parseLinks(links: string) {
      const linkPat = /-\s*\[(?<title>[^\]]+)\]\((?<url>[^\)]+)\)(?::\s*(?<desc>.*?))?$/gm;
      return Array.from(links.matchAll(linkPat)).map(match => match.groups);
  }

  const [start, ...rest] = txt.split(/^##\s*(.*?)$/m);
  const sections = Object.fromEntries(
      Array.from({ length: Math.floor(rest.length / 2) }, (_, i) => [
          rest[i * 2],
          parseLinks(rest[i * 2 + 1])
      ])
  );

  const pat = /^#\s*(?<title>.+?$)\n+(?:^>\s*(?<summary>.+?$))?\n+(?<info>.*)/ms;
  const match = start.trim().match(pat);
  const result = { ...match?.groups, sections };

  return result;
}