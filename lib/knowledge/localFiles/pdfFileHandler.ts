import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { saveProcessedContent } from './fileHandler';

// Get paths from environment variables with fallbacks
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const PDF_DIR = process.env.PDF_DIR || path.join(STORAGE_DIR, 'pdf');

// Ensure directory exists
if (!fs.existsSync(PDF_DIR)) {
  console.log(`Creating directory: ${PDF_DIR}`);
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Generates a file path for a PDF file based on user ID and document ID
 */
export function getPdfFilePath(userId: string, documentId: string, originalName: string): string {
  // Get file extension or default to .pdf
  const ext = path.extname(originalName) || '.pdf';
  // Create a subdirectory for this user
  const userDir = path.join(PDF_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate path
  return path.join(userDir, `${documentId}${ext}`);
}

/**
 * Saves a PDF file to the local storage system
 */
export async function savePdfFile(file: File, userId: string, documentId: string): Promise<string> {
  try {
    // Generate file path
    const filePath = getPdfFilePath(userId, documentId, file.name);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to file system
    fs.writeFileSync(filePath, buffer);
    console.log(`[PDF HANDLER] Saved PDF file to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('[PDF HANDLER] Error saving PDF file:', error);
    throw new Error('Failed to save PDF file');
  }
}