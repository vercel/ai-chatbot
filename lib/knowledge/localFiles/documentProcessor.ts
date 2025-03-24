import { KnowledgeDocument } from '../../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../../db/queries';
import { OpenAI } from 'openai';
import {
  saveProcessedContent,
  getProcessedContent,
  isDocumentProcessed,
  saveEmbedding,
  getEmbedding,
  cleanupDocumentFiles,
  getUploadFilePath
} from './fileHandler';
import { extractTextFromPdf, getPdfMetadata } from './pdfExtractor';
import path from 'path';

// Create OpenAI client
const openai = new OpenAI();

interface ProcessDocumentParams {
  document: KnowledgeDocument;
  content?: string;
  userId: string;
  filePath?: string;
}

/**
 * Process a document by extracting text, chunking it, and creating embeddings
 * Uses local file storage for caching and persistence
 */
export async function processDocumentLocal({
  document,
  content,
  userId,
  filePath,
}: ProcessDocumentParams) {
  console.log(`\n[DOCUMENT PROCESSOR] Starting processing of document: "${document.title}" (${document.id})`);
  console.log(`[DOCUMENT PROCESSOR] Source type: ${document.sourceType}`);
  
  try {
    // Check if this document has already been processed
    if (isDocumentProcessed(userId, document.id)) {
      console.log(`[DOCUMENT PROCESSOR] Document already processed, using cached data`);
      const processedData = getProcessedContent(userId, document.id);
      
      // Update document status to completed
      await updateKnowledgeDocument({
        id: document.id,
        status: 'completed',
      });
      
      return { success: true, cached: true, data: processedData };
    }
    
    // Extract text based on document type
    let extractedText = '';
    
    if (document.sourceType === 'text' && content) {
      extractedText = content;
      console.log(`[DOCUMENT PROCESSOR] Using provided text content (${content.length} characters)`);
    } else if ((document.sourceType === 'pdf' || document.sourceType === 'file') && filePath) {
      // Process PDF file
      console.log(`[DOCUMENT PROCESSOR] Processing PDF file: ${filePath}`);
      extractedText = await extractTextFromPdf(filePath);
      console.log(`[DOCUMENT PROCESSOR] Extracted ${extractedText.length} characters from PDF`);
      
      // Get PDF metadata for file size and update the document
      try {
        const metadata = await getPdfMetadata(filePath);
        await updateKnowledgeDocument({
          id: document.id,
          fileSize: metadata.fileSize,
        });
        console.log(`[DOCUMENT PROCESSOR] Updated document with PDF metadata`);
      } catch (metadataError) {
        console.error(`[DOCUMENT PROCESSOR] Error getting PDF metadata:`, metadataError);
        // Continue processing even if metadata extraction fails
      }
    } else {
      console.error(`[DOCUMENT PROCESSOR] Error: Unsupported document type or missing content: ${document.sourceType}`);
      throw new Error(`Unsupported document type or missing content: ${document.sourceType}`);
    }

    console.log(`[DOCUMENT PROCESSOR] Text extraction complete. Extracted ${extractedText.length} characters`);
    
    // Split text into chunks
    console.log(`[DOCUMENT PROCESSOR] Splitting text into chunks...`);
    const chunks = splitTextIntoChunks(extractedText);
    console.log(`[DOCUMENT PROCESSOR] Created ${chunks.length} chunks`);
    
    // Process chunks and create embeddings
    const processedChunks = [];
    
    console.log(`[DOCUMENT PROCESSOR] Processing chunks and creating embeddings...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[DOCUMENT PROCESSOR] Processing chunk ${i+1}/${chunks.length} (${chunk.length} chars)`);
      
      // Check if we already have an embedding for this chunk
      let embedding = getEmbedding(chunk);
      let embeddingSource = 'cache';
      
      // If not, generate a new embedding
      if (!embedding) {
        console.log(`[DOCUMENT PROCESSOR] No cached embedding found, generating new one`);
        embedding = await createEmbeddingWithAPI(chunk);
        embeddingSource = 'new';
        
        // Save the embedding for future use
        saveEmbedding(chunk, embedding);
      } else {
        console.log(`[DOCUMENT PROCESSOR] Using cached embedding`);
      }
      
      // Store chunk and embedding in database
      const chunkData = await createKnowledgeChunk({
        documentId: document.id,
        content: chunk,
        metadata: {
          index: i,
          documentTitle: document.title,
          documentType: document.sourceType,
          embeddingSource,
        },
        chunkIndex: i.toString(),
        embedding: embedding,
      });
      
      console.log(`[DOCUMENT PROCESSOR] Stored chunk ${i+1} in database`);
      
      processedChunks.push({
        id: chunkData.id,
        index: i,
        contentPreview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''),
        contentLength: chunk.length,
        embeddingSource,
      });
    }
    
    // Save processed data to local storage
    const processedData = {
      documentId: document.id,
      title: document.title,
      sourceType: document.sourceType,
      extractedTextLength: extractedText.length,
      chunkCount: chunks.length,
      processedAt: new Date().toISOString(),
      chunks: processedChunks,
    };
    
    saveProcessedContent(userId, document.id, processedData);
    console.log(`[DOCUMENT PROCESSOR] Saved processed data to local storage`);

    // Update document status to completed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'completed',
    });
    console.log(`[DOCUMENT PROCESSOR] Document processing completed successfully`);

    return { success: true, cached: false, data: processedData };
  } catch (error) {
    console.error('[DOCUMENT PROCESSOR] Error processing document:', error);
    
    // Update document status to failed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'failed',
      processingError: error instanceof Error ? error.message : 'Unknown error',
    });

    // Clean up any files created during processing
    cleanupDocumentFiles(userId, document.id);

    console.log(`[DOCUMENT PROCESSOR] Document marked as failed due to error`);
    throw error;
  }
}

/**
 * Split text into chunks of approximately 800-1000 tokens
 */
export function splitTextIntoChunks(text: string): string[] {
  // A simple implementation that splits by paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // Rough estimate: 1 token ≈ 4 characters
    if (currentChunk.length + paragraph.length > 3500) { // ~875 tokens
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Create an embedding for a text chunk using OpenAI's embedding API
 */
export async function createEmbeddingWithAPI(text: string): Promise<number[]> {
  try {
    console.log(`[DOCUMENT PROCESSOR] Generating embedding via OpenAI API`);
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[DOCUMENT PROCESSOR] Error creating embedding:', error);
    // Return empty embedding in case of error
    return [];
  }
}
