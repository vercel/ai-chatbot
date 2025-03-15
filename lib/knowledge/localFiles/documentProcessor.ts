import { KnowledgeDocument } from '../../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../../db/queries';
import OpenAI from 'openai';
import {
  saveUploadedFile,
  saveProcessedContent,
  getProcessedContent,
  isDocumentProcessed,
  saveEmbedding,
  getEmbedding,
  cleanupDocumentFiles
} from './fileHandler';
import * as fs from 'fs';
import * as path from 'path';

// Create OpenAI client
const openai = new OpenAI();

interface ProcessDocumentParams {
  document: KnowledgeDocument;
  content?: string;
  file?: File;
  userId: string;
}

/**
 * Process a document by extracting text, chunking it, and creating embeddings
 * Uses local file storage for caching and persistence
 */
export async function processDocumentLocal({
  document,
  content,
  file,
  userId,
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
    let filePath = '';
    console.log(`[DOCUMENT PROCESSOR] Extracting text content...`);
    
    if (document.sourceType === 'text' && content) {
      extractedText = content;
      console.log(`[DOCUMENT PROCESSOR] Using provided text content (${content.length} characters)`);
    } else if (document.sourceType === 'url') {
      console.log(`[DOCUMENT PROCESSOR] Extracting content from URL: ${document.sourceUrl}`);
      extractedText = await extractTextFromUrl(document.sourceUrl || '');
    } else if (document.sourceType === 'youtube') {
      console.log(`[DOCUMENT PROCESSOR] Extracting transcript from YouTube: ${document.sourceUrl}`);
      extractedText = await extractTextFromYouTube(document.sourceUrl || '');
    } else if (document.sourceType === 'pdf' && file) {
      // Save the uploaded file
      filePath = await saveUploadedFile(file, userId, document.id);
      console.log(`[DOCUMENT PROCESSOR] Saved PDF file: ${filePath}`);
      
      // Extract text from PDF
      extractedText = await extractTextFromPdf(filePath);
      console.log(`[DOCUMENT PROCESSOR] Extracted text from PDF (${extractedText.length} characters)`);
    } else if ((document.sourceType === 'audio' || document.sourceType === 'video') && file) {
      // Save the uploaded file
      filePath = await saveUploadedFile(file, userId, document.id);
      console.log(`[DOCUMENT PROCESSOR] Saved ${document.sourceType} file: ${filePath}`);
      
      // Transcribe audio/video
      extractedText = await transcribeAudioVideo(filePath, document.sourceType);
      console.log(`[DOCUMENT PROCESSOR] Transcribed ${document.sourceType} (${extractedText.length} characters)`);
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
          filePath: filePath || undefined,
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
      filePath: filePath || undefined,
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
 * Extract text from a URL by fetching and parsing the content
 */
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    // In a real implementation, you would use a library like cheerio or puppeteer
    // to fetch and parse the HTML content
    // For now, we'll just return a placeholder
    return `Content extracted from URL: ${url}`;
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw new Error('Failed to extract text from URL');
  }
}

/**
 * Extract text from a YouTube video by fetching its transcript
 */
async function extractTextFromYouTube(url: string): Promise<string> {
  try {
    // In a real implementation, you would use the YouTube API or a library
    // to fetch the transcript
    // For now, we'll just return a placeholder
    return `Transcript extracted from YouTube video: ${url}`;
  } catch (error) {
    console.error('Error extracting text from YouTube:', error);
    throw new Error('Failed to extract text from YouTube video');
  }
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // In a real implementation, you would use a library like pdf-parse
    // For a placeholder implementation:
    return `Text extracted from PDF file: ${path.basename(filePath)}. This is placeholder text for demonstration purposes. In a real implementation, this would contain the actual text extracted from the PDF file using a library like pdf-parse.`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Transcribe audio or video file
 */
async function transcribeAudioVideo(filePath: string, type: string): Promise<string> {
  try {
    // In a real implementation, you would use OpenAI's Whisper API or similar
    // For a placeholder implementation:
    return `Transcription of ${path.basename(filePath)} (${type}). This is placeholder text for demonstration purposes. In a real implementation, this would contain the actual transcription from the audio or video file.`;
  } catch (error) {
    console.error(`Error transcribing ${type}:`, error);
    throw new Error(`Failed to transcribe ${type}`);
  }
}

/**
 * Split text into chunks of approximately 800-1000 tokens
 */
function splitTextIntoChunks(text: string): string[] {
  // A simple implementation that splits by paragraphs
  // In a real implementation, you would use a more sophisticated approach
  // that considers token count and semantic boundaries
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
async function createEmbeddingWithAPI(text: string): Promise<number[]> {
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
