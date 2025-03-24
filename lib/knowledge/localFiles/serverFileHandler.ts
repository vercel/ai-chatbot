import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { NextRequest } from 'next/server';
import { join } from 'path';

// Get paths from environment variables with fallbacks
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(STORAGE_DIR, 'uploads');

// Ensure directories exist
for (const dir of [STORAGE_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Process file uploads from FormData in API routes
 * @param formData FormData from the request
 * @param fieldName Name of the file field in the form
 * @param userId User ID for creating the file path
 * @param documentId Document ID for the filename
 * @returns Path to the saved file
 */
export async function handleFileUpload(
  formData: FormData,
  fieldName: string,
  userId: string,
  documentId: string
): Promise<string> {
  try {
    // Get the file from the form data
    const file = formData.get(fieldName);
    
    if (!file || !(file instanceof Blob)) {
      throw new Error(`No file found in field '${fieldName}'`);
    }
    
    // Get the file name from the form data if available, or use a default
    let fileName = 'unknown';
    if ('name' in file && typeof file.name === 'string') {
      fileName = file.name;
    }
    
    console.log(`[SERVER FILE HANDLER] Processing uploaded file: ${fileName}`);
    
    // Create user directory if it doesn't exist
    const userDir = path.join(UPLOADS_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Create the file path
    const ext = path.extname(fileName);
    const filePath = path.join(userDir, `${documentId}${ext}`);
    
    // Convert blob to ArrayBuffer and save to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await writeFile(filePath, buffer);
    
    console.log(`[SERVER FILE HANDLER] Saved file to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('[SERVER FILE HANDLER] Error processing file upload:', error);
    throw new Error(`Failed to process file upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
