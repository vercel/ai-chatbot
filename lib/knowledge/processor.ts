import { KnowledgeDocument } from '../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../db/queries';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Create OpenAI client
const openai = new OpenAI();

// Cache directory for embeddings
const EMBEDDINGS_CACHE_DIR = path.join(process.cwd(), '.cache', 'document-embeddings');

// Ensure cache directory exists
try {
  if (!fs.existsSync(EMBEDDINGS_CACHE_DIR)) {
    fs.mkdirSync(EMBEDDINGS_CACHE_DIR, { recursive: true });
    console.log(`Created document embeddings cache directory at ${EMBEDDINGS_CACHE_DIR}`);
  }
} catch (error) {
  console.error('Error creating embeddings cache directory:', error);
}

interface ProcessDocumentParams {
  document: KnowledgeDocument;
  content?: string;
  file?: File;
}

/**
 * Process a document by extracting text, chunking it, and creating embeddings
 */
export async function processDocument({
  document,
  content,
  file,
}: ProcessDocumentParams) {
  console.log(`\n[KNOWLEDGE PROCESSOR] Starting processing of document: "${document.title}" (${document.id})`);
  console.log(`[KNOWLEDGE PROCESSOR] Source type: ${document.sourceType}`);
  
  try {
    // Extract text based on document type
    let extractedText = '';
    console.log(`[KNOWLEDGE PROCESSOR] Extracting text content...`);
    
    if (document.sourceType === 'text' && content) {
      extractedText = content;
      console.log(`[KNOWLEDGE PROCESSOR] Using provided text content (${content.length} characters)`);
    } else if (document.sourceType === 'url') {
      console.log(`[KNOWLEDGE PROCESSOR] Extracting content from URL: ${document.sourceUrl}`);
      extractedText = await extractTextFromUrl(document.sourceUrl || '');
    } else if (document.sourceType === 'youtube') {
      console.log(`[KNOWLEDGE PROCESSOR] Extracting transcript from YouTube: ${document.sourceUrl}`);
      extractedText = await extractTextFromYouTube(document.sourceUrl || '');
    } else if (document.sourceType === 'pdf' && file) {
      console.log(`[KNOWLEDGE PROCESSOR] Extracting text from PDF: ${file.name}`);
      extractedText = await extractTextFromPdf(file);
    } else if ((document.sourceType === 'audio' || document.sourceType === 'video') && file) {
      console.log(`[KNOWLEDGE PROCESSOR] Transcribing ${document.sourceType} file: ${file.name}`);
      extractedText = await transcribeAudioVideo(file);
    } else {
      console.error(`[KNOWLEDGE PROCESSOR] Error: Unsupported document type or missing content: ${document.sourceType}`);
      throw new Error(`Unsupported document type or missing content: ${document.sourceType}`);
    }

    console.log(`[KNOWLEDGE PROCESSOR] Text extraction complete. Extracted ${extractedText.length} characters`);
    
    // Split text into chunks
    console.log(`[KNOWLEDGE PROCESSOR] Splitting text into chunks...`);
    const chunks = splitTextIntoChunks(extractedText);
    console.log(`[KNOWLEDGE PROCESSOR] Created ${chunks.length} chunks`);
    
    // Create embeddings and store chunks
    console.log(`[KNOWLEDGE PROCESSOR] Processing chunks and creating embeddings...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[KNOWLEDGE PROCESSOR] Processing chunk ${i+1}/${chunks.length} (${chunk.length} chars)`);
      
      // Generate embedding
      const embedding = await createEmbedding(chunk);
      console.log(`[KNOWLEDGE PROCESSOR] Created embedding for chunk ${i+1}`);
      
      // Store chunk and embedding in database
      await createKnowledgeChunk({
        documentId: document.id,
        content: chunk,
        metadata: {
          index: i,
          documentTitle: document.title,
          documentType: document.sourceType,
        },
        chunkIndex: i.toString(),
        embedding,
      });
      console.log(`[KNOWLEDGE PROCESSOR] Stored chunk ${i+1} in database`);
    }

    // Update document status to completed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'completed',
    });
    console.log(`[KNOWLEDGE PROCESSOR] Document processing completed successfully`);

    return { success: true };
  } catch (error) {
    console.error('[KNOWLEDGE PROCESSOR] Error processing document:', error);
    
    // Update document status to failed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'failed',
      processingError: error instanceof Error ? error.message : 'Unknown error',
    });

    console.log(`[KNOWLEDGE PROCESSOR] Document marked as failed due to error`);
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
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // In a real implementation, you would use a library like pdf-parse
    // to extract text from the PDF
    // For now, we'll just return a placeholder
    return `Text extracted from PDF file: ${file.name}`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Transcribe audio or video file using OpenAI's Whisper API
 */
async function transcribeAudioVideo(file: File): Promise<string> {
  try {
    // In a real implementation, you would use OpenAI's Whisper API
    // to transcribe the audio/video
    // For now, we'll just return a placeholder
    return `Transcription of ${file.name}`;
  } catch (error) {
    console.error('Error transcribing audio/video:', error);
    throw new Error('Failed to transcribe audio/video');
  }
}

/**
 * Split text into chunks of approximately 800-1000 tokens
 */
function splitTextIntoChunks(text: string): string[] {
  // A very simple implementation that splits by paragraphs
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
 * with local caching to avoid redundant API calls
 */
async function createEmbedding(text: string): Promise<number[]> {
  try {
    // Create a hash of the text to use as a cache key
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const cachePath = path.join(EMBEDDINGS_CACHE_DIR, `${textHash}.json`);
    
    // Check cache first
    if (fs.existsSync(cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        console.log(`[KNOWLEDGE PROCESSOR] Using cached embedding for chunk`);
        return cachedData.embedding;
      } catch (error) {
        console.error(`[KNOWLEDGE PROCESSOR] Error reading embedding cache:`, error);
        // Continue to generate new embedding if cache read fails
      }
    }
    
    // Generate new embedding
    console.log(`[KNOWLEDGE PROCESSOR] Generating new embedding via OpenAI API`);
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embedding = response.data[0].embedding;
    
    // Save to cache
    try {
      fs.writeFileSync(cachePath, JSON.stringify({ 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), // Save preview of text
        embedding,
        timestamp: new Date().toISOString()
      }));
      console.log(`[KNOWLEDGE PROCESSOR] Saved embedding to cache`);
    } catch (error) {
      console.error(`[KNOWLEDGE PROCESSOR] Error saving embedding to cache:`, error);
    }

    return embedding;
  } catch (error) {
    console.error('[KNOWLEDGE PROCESSOR] Error creating embedding:', error);
    // Return empty embedding in case of error
    return [];
  }
} 