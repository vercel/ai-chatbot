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
 * Split text into chunks with overlapping content to maintain context.
 * The function tries to split at sentence boundaries and maintains overlapping
 * segments to preserve context across chunks.
 * 
 * @param {string} text - The text to split into chunks
 * @param {number} chunkSize - Target size of each chunk in characters (default: 2000)
 * @param {number} overlapSize - Number of characters to overlap between chunks (default: 400)
 * @returns {string[]} An array of text chunks
 */
function splitTextIntoChunks(text, chunkSize = 2000, overlapSize = 400) {
  // Early return for empty or very short texts
  if (!text || text.length <= chunkSize) {
    return text ? [text] : [];
  }

  console.log(`[KNOWLEDGE PROCESSOR] Splitting text (${text.length} chars) into chunks of ~${chunkSize} chars with ${overlapSize} char overlap`);
  
  // Split the text into sentences
  // This regex looks for sentence-ending punctuation followed by a space or newline
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  
  console.log(`[KNOWLEDGE PROCESSOR] Text split into ${sentences.length} sentences`);
  
  // For extremely long sentences, we need to forcibly split them
  const processedSentences = [];
  for (const sentence of sentences) {
    // If sentence is really long, split it further (ensuring we don't exceed chunk size)
    if (sentence.length > chunkSize) {
      // Use a sliding window approach for long sentences
      for (let i = 0; i < sentence.length; i += (chunkSize / 2)) {
        // Don't create tiny fragments at the end
        const end = Math.min(i + chunkSize, sentence.length);
        processedSentences.push(sentence.substring(i, end));
        
        // If we're at the end, stop to avoid tiny fragments
        if (end === sentence.length) break;
      }
    } else {
      processedSentences.push(sentence);
    }
  }
  
  if (processedSentences.length > sentences.length) {
    console.log(`[KNOWLEDGE PROCESSOR] Further split ${sentences.length} sentences into ${processedSentences.length} segments due to length`);
  }
  
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;
  
  // Process each sentence
  for (let i = 0; i < processedSentences.length; i++) {
    const sentence = processedSentences[i];
    
    // Add sentence to current chunk
    currentChunk.push(sentence);
    currentLength += sentence.length + (currentChunk.length > 1 ? 1 : 0); // Add space if not first sentence
    
    // Check if current chunk exceeds target size or if we're at the end
    const isLastSentence = i === processedSentences.length - 1;
    
    if (currentLength >= chunkSize || isLastSentence) {
      // Create chunk from current sentences
      if (currentChunk.length > 0) {
        const chunkText = currentChunk.join(' ');
        chunks.push(chunkText);
        
        // Debug info
        console.log(`[KNOWLEDGE PROCESSOR] Created chunk ${chunks.length} with ${chunkText.length} chars and ${currentChunk.length} sentences`);
      }
      
      // If not at the end, prepare the next chunk with overlap
      if (!isLastSentence) {
        // Calculate overlap (keep sentences until we have enough overlap)
        let overlapLength = 0;
        let overlapSentences = [];
        
        // Go backwards through current chunk for overlap
        for (let j = currentChunk.length - 1; j >= 0 && overlapLength < overlapSize; j--) {
          const sentenceWithSpace = currentChunk[j] + (j > 0 ? ' ' : '');
          overlapLength += sentenceWithSpace.length;
          overlapSentences.unshift(currentChunk[j]);
        }
        
        // Start next chunk with overlap sentences
        currentChunk = [...overlapSentences];
        currentLength = overlapLength;
        
        console.log(`[KNOWLEDGE PROCESSOR] Starting next chunk with ${overlapLength} chars overlap (${overlapSentences.length} sentences)`);
      } else {
        // Reset for potential next iteration
        currentChunk = [];
        currentLength = 0;
      }
    }
  }
  
  // Remove any empty chunks and trim whitespace
  const finalChunks = chunks.map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
  
  // Final statistics
  if (finalChunks.length > 0) {
    const totalChars = finalChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const avgChunkSize = Math.round(totalChars / finalChunks.length);
    console.log(`[KNOWLEDGE PROCESSOR] Created ${finalChunks.length} chunks with average size of ${avgChunkSize} characters`);
    
    // Log chunk sizes for debugging
    finalChunks.forEach((chunk, i) => {
      console.log(`[KNOWLEDGE PROCESSOR] Chunk ${i+1} size: ${chunk.length} characters`);
    });
  } else {
    console.log(`[KNOWLEDGE PROCESSOR] Warning: No chunks were created from text of length ${text.length}`);
  }
  
  return finalChunks;
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