import { KnowledgeDocument } from '../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../db/queries';
import { OpenAI } from 'openai';
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
    } else {
      // For all other types, use the server-side processing API
      try {
        const response = await fetch('/api/knowledge/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: document.sourceType,
            content: content,
            url: document.sourceUrl
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.content) {
          extractedText = data.content;
          console.log(`[KNOWLEDGE PROCESSOR] Received processed content from API (${extractedText.length} characters)`);
        } else {
          throw new Error(data.error || 'Unknown error processing content');
        }
      } catch (apiError) {
        console.error('[KNOWLEDGE PROCESSOR] Error calling processing API:', apiError);
        extractedText = `Unable to process ${document.sourceType} content. Error: ${apiError.message}`;
      }
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