import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// Get paths from environment variables with fallbacks
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(STORAGE_DIR, 'uploads');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(STORAGE_DIR, 'processed');
const EMBEDDINGS_DIR = process.env.EMBEDDINGS_DIR || path.join(STORAGE_DIR, 'embeddings');

// Ensure directories exist
for (const dir of [STORAGE_DIR, UPLOADS_DIR, PROCESSED_DIR, EMBEDDINGS_DIR]) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates a file path for an uploaded file based on user ID and document ID
 */
export function getUploadFilePath(userId: string, documentId: string, originalName: string): string {
  // Get file extension
  const ext = path.extname(originalName);
  // Create a subdirectory for this user
  const userDir = path.join(UPLOADS_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate path
  return path.join(userDir, `${documentId}${ext}`);
}

/**
 * Saves an uploaded file to the local storage system
 */
export async function saveUploadedFile(file: File, userId: string, documentId: string): Promise<string> {
  try {
    // Generate file path
    const filePath = getUploadFilePath(userId, documentId, file.name);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to file system
    fs.writeFileSync(filePath, buffer);
    console.log(`[FILE HANDLER] Saved uploaded file to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('[FILE HANDLER] Error saving uploaded file:', error);
    throw new Error('Failed to save uploaded file');
  }
}

/**
 * Gets the path for processed content
 */
export function getProcessedFilePath(userId: string, documentId: string): string {
  // Create a subdirectory for this user
  const userDir = path.join(PROCESSED_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate path
  return path.join(userDir, `${documentId}.json`);
}

/**
 * Saves processed document content (text, chunks, etc.)
 */
export function saveProcessedContent(userId: string, documentId: string, data: any): string {
  try {
    const filePath = getProcessedFilePath(userId, documentId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[FILE HANDLER] Saved processed content to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('[FILE HANDLER] Error saving processed content:', error);
    throw new Error('Failed to save processed content');
  }
}

/**
 * Checks if a document has already been processed
 */
export function isDocumentProcessed(userId: string, documentId: string): boolean {
  const filePath = getProcessedFilePath(userId, documentId);
  return fs.existsSync(filePath);
}

/**
 * Gets processed document content if it exists
 */
export function getProcessedContent(userId: string, documentId: string): any | null {
  try {
    const filePath = getProcessedFilePath(userId, documentId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[FILE HANDLER] Error reading processed content:', error);
    return null;
  }
}

/**
 * Gets the path for embedding storage
 */
export function getEmbeddingFilePath(textHash: string): string {
  return path.join(EMBEDDINGS_DIR, `${textHash}.json`);
}

/**
 * Saves an embedding for a text chunk
 */
export function saveEmbedding(text: string, embedding: number[]): string {
  try {
    // Create a hash of the text as a unique identifier
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const filePath = getEmbeddingFilePath(textHash);
    
    // Save the embedding with metadata
    fs.writeFileSync(filePath, JSON.stringify({
      hash: textHash,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      embedding,
      created: new Date().toISOString()
    }, null, 2));
    
    console.log(`[FILE HANDLER] Saved embedding to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('[FILE HANDLER] Error saving embedding:', error);
    throw new Error('Failed to save embedding');
  }
}

/**
 * Gets an embedding for a text chunk if it exists
 */
export function getEmbedding(text: string): number[] | null {
  try {
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const filePath = getEmbeddingFilePath(textHash);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    return data.embedding;
  } catch (error) {
    console.error('[FILE HANDLER] Error reading embedding:', error);
    return null;
  }
}

/**
 * Cleans up files for a document (use if processing fails)
 */
export function cleanupDocumentFiles(userId: string, documentId: string): void {
  try {
    // Remove uploaded file
    const uploadDir = path.join(UPLOADS_DIR, userId);
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file.startsWith(documentId)) {
          fs.unlinkSync(path.join(uploadDir, file));
          console.log(`[FILE HANDLER] Removed uploaded file: ${file}`);
        }
      }
    }
    
    // Remove processed content
    const processedPath = getProcessedFilePath(userId, documentId);
    if (fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
      console.log(`[FILE HANDLER] Removed processed file: ${processedPath}`);
    }
    
    // Note: We don't remove embeddings as they might be shared between documents
  } catch (error) {
    console.error('[FILE HANDLER] Error cleaning up document files:', error);
  }
}
