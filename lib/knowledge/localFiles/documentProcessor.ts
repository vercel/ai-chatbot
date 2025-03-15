import { KnowledgeDocument } from '../../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../../db/queries';
import { OpenAI } from 'openai';
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

// We're using client-side PDF processing, so no server-side PDF library is needed

// Create OpenAI client
const openai = new OpenAI();

interface ProcessDocumentParams {
  document: KnowledgeDocument;
  content?: string;
  userId: string;
}

/**
 * Process a document by extracting text, chunking it, and creating embeddings
 * Uses local file storage for caching and persistence
 */
export async function processDocumentLocal({
  document,
  content,
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
    
    if (document.sourceType === 'text' && content) {
      extractedText = content;
      console.log(`[DOCUMENT PROCESSOR] Using provided text content (${content.length} characters)`);
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
        embedding: embedding,  // This is already a number[] type
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
 * Extract text from a URL by fetching and parsing the content
 */
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    console.log(`[DOCUMENT PROCESSOR] Extracting content from URL: ${url}`);
    
    // Due to CORS restrictions, we can't directly fetch many URLs from the browser
    // In a real implementation, you'd use a server-side proxy or service
    
    // Return a more informative message
    return `Content from URL: ${url}\n\nThis is a placeholder for the content that would be extracted from the URL. In a production environment, we would use a server-side proxy to fetch the content to avoid CORS issues.\n\nThe extracted content would include all relevant text from the webpage, with proper formatting and structure preservation.`;
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw new Error(`Failed to extract text from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from a YouTube video by fetching its transcript
 */
async function extractTextFromYouTube(url: string): Promise<string> {
  try {
    console.log(`[DOCUMENT PROCESSOR] Extracting transcript from YouTube URL: ${url}`);
    
    // Extract video ID from URL
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }
    
    console.log(`[DOCUMENT PROCESSOR] Extracted video ID: ${videoId}`);
    
    // Due to CORS restrictions in the browser, we can't directly call YouTube's API
    // In a real implementation, you'd have a server-side endpoint to handle this
    
    // For now, return a more informative message than before
    return `Transcript from YouTube video: ${url}\n\nThis is a placeholder for the video transcript. In a production environment, we would use the YouTube API with proper authentication to fetch the actual transcript.\n\nVideo ID: ${videoId}\n\nThe transcript would include all spoken content from the video, formatted as text with timestamps.`;
  } catch (error) {
    console.error('Error extracting text from YouTube:', error);
    throw new Error(`Failed to extract text from YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to extract YouTube video ID from various URL formats
 */
function extractYoutubeVideoId(url: string): string | null {
  // Regular expressions to match different YouTube URL formats
  const regexps = [
    /youtube\.com\/watch\?v=([^&]+)/,       // Standard YouTube URL
    /youtube\.com\/embed\/([^/?]+)/,        // Embedded YouTube URL
    /youtube\.com\/v\/([^/?]+)/,            // Old YouTube URL
    /youtu\.be\/([^/?]+)/                   // Short YouTube URL
  ];
  
  for (const regex of regexps) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    console.log(`[DOCUMENT PROCESSOR] Reading PDF file: ${filePath}`);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`[DOCUMENT PROCESSOR] PDF file not found: ${filePath}`);
      throw new Error(`PDF file not found or unable to access: ${path.basename(filePath)}`);
    }
    
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const fileSize = stats.size;
    
    console.log(`[DOCUMENT PROCESSOR] PDF file exists, size: ${fileSize} bytes`);
    
    // Our system now uses client-side PDF processing instead of server-side
    // Return a message notifying that text has been extracted via the client-side process
    return `PDF text extraction is handled client-side in this version of the application. The file ${fileName} (${fileSize} bytes) has been saved and should be processed through the browser-based extraction process.`;
  } catch (error) {
    console.error('Error handling PDF file:', error);
    // Fall back to a basic message if there's an error
    const fileName = path.basename(filePath);
    return `There was an issue with the PDF file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}. PDF text extraction is now handled client-side in this application.`;
  }
}

/**
 * Transcribe audio or video file
 */
async function transcribeAudioVideo(filePath: string, type: string): Promise<string> {
  try {
    console.log(`[DOCUMENT PROCESSOR] Attempting to transcribe ${type} file: ${filePath}`);
    
    // In a production environment, we would use a service like OpenAI's Whisper API
    // or another transcription service to process the audio/video
    
    // For now, since we don't have actual integration with a transcription API in this sample,
    // we'll return a more informative message than before
    
    // Note: With an actual OpenAI API integration, the code would look something like this:
    /*
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });
    
    return response.text;
    */
    
    // Instead, we'll return this message explaining what's happening
    return `This is a placeholder for ${type} transcription of ${path.basename(filePath)}. ` +
      `In a production environment, this would contain the actual transcription from the ${type} file ` +
      `using a service like OpenAI's Whisper API. The transcription would include all spoken content ` +
      `from the ${type} file, formatted as text.`;
      
  } catch (error) {
    console.error(`Error transcribing ${type}:`, error);
    throw new Error(`Failed to transcribe ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
