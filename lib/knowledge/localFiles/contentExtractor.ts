/**
 * This module provides functions to extract content directly from 
 * stored documents in both processed and raw formats.
 * It's used as a fallback when database access fails.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';

// Get storage directories from environment variables
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(STORAGE_DIR, 'processed');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(STORAGE_DIR, 'uploads');

/**
 * Gets all document information for a user
 */
export function getUserDocuments(userId: string): Array<any> {
  try {
    // Check if user directory exists
    const userDir = path.join(PROCESSED_DIR, userId);
    if (!fs.existsSync(userDir)) {
      console.log(`[EXTRACTOR] No processed documents for user ${userId}`);
      return [];
    }
    
    // Get all processed files
    const files = fs.readdirSync(userDir);
    if (files.length === 0) {
      console.log('[EXTRACTOR] No processed files found');
      return [];
    }
    
    console.log(`[EXTRACTOR] Found ${files.length} processed files for user ${userId}`);
    
    // Extract document information
    const documents: Array<any> = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(userDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        documents.push({
          id: data.documentId || path.basename(file, '.json'),
          title: data.title || 'Untitled Document',
          sourceType: data.sourceType || 'unknown',
          chunkCount: data.chunkCount || 0,
          processedAt: data.processedAt || null,
          extractedTextLength: data.extractedTextLength || 0,
          filePath: data.filePath || null
        });
      } catch (fileError) {
        console.error(`[EXTRACTOR] Error processing document metadata file ${file}:`, fileError);
      }
    }
    
    return documents;
  } catch (error) {
    console.error('[EXTRACTOR] Error getting user documents:', error);
    return [];
  }
}

/**
 * Extracts full content from a document
 */
export function getDocumentContent(userId: string, documentId: string): string | null {
  try {
    // First, check for processed document
    const processedPath = path.join(PROCESSED_DIR, userId, `${documentId}.json`);
    if (fs.existsSync(processedPath)) {
      console.log(`[EXTRACTOR] Found processed document: ${processedPath}`);
      
      try {
        const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        
        // Check if document has a filePath
        if (processedData.filePath && fs.existsSync(processedData.filePath)) {
          console.log(`[EXTRACTOR] Found original file at path: ${processedData.filePath}`);
          
          // Extract content based on file type
          const fileExt = path.extname(processedData.filePath).toLowerCase();
          if (fileExt === '.txt') {
            return fs.readFileSync(processedData.filePath, 'utf8');
          } else if (fileExt === '.json') {
            const jsonContent = JSON.parse(fs.readFileSync(processedData.filePath, 'utf8'));
            return typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent, null, 2);
          }
        }
      } catch (processedError) {
        console.error('[EXTRACTOR] Error reading processed document:', processedError);
      }
    }
    
    // Check uploads directory for original file
    const userUploadsDir = path.join(UPLOADS_DIR, userId);
    if (fs.existsSync(userUploadsDir)) {
      const files = fs.readdirSync(userUploadsDir);
      const docFiles = files.filter(file => file.startsWith(documentId));
      
      if (docFiles.length > 0) {
        const docFile = docFiles[0];
        const filePath = path.join(userUploadsDir, docFile);
        console.log(`[EXTRACTOR] Found uploaded file: ${filePath}`);
        
        // Simple text extraction based on file extension
        const fileExt = path.extname(filePath).toLowerCase();
        
        if (fileExt === '.txt') {
          return fs.readFileSync(filePath, 'utf8');
        } else if (fileExt === '.json') {
          try {
            const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent, null, 2);
          } catch (e) {
            return fs.readFileSync(filePath, 'utf8');
          }
        }
      }
    }
    
    console.log(`[EXTRACTOR] Could not find content for document ${documentId}`);
    return null;
  } catch (error) {
    console.error('[EXTRACTOR] Error extracting document content:', error);
    return null;
  }
}

/**
 * Splits a document into chunks for better processing
 */
export function getDocumentChunks(userId: string, documentId: string, chunkSize: number = 1000): string[] {
  const content = getDocumentContent(userId, documentId);
  if (!content) return [];
  
  // Simple chunking by characters
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.substring(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Searches for content within all user documents
 * Returns chunks that match the query
 */
export function searchUserDocuments(userId: string, query: string, limit: number = 5): Array<any> {
  try {
    // Get all user documents
    const documents = getUserDocuments(userId);
    if (documents.length === 0) return [];
    
    // Store matching chunks
    const matches: Array<any> = [];
    const queryTerms = query.toLowerCase().split(/\W+/).filter(term => term.length > 2);
    
    // Search each document for matches
    for (const doc of documents) {
      const content = getDocumentContent(userId, doc.id);
      if (!content) continue;
      
      // Simple text search (could be enhanced with more advanced algorithms)
      let score = 0;
      for (const term of queryTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      
      if (score > 0) {
        // Found matches, extract relevant chunks
        const chunks = getDocumentChunks(userId, doc.id);
        
        for (const chunk of chunks) {
          let chunkScore = 0;
          for (const term of queryTerms) {
            const regex = new RegExp(term, 'gi');
            const chunkMatches = chunk.match(regex);
            if (chunkMatches) {
              chunkScore += chunkMatches.length;
            }
          }
          
          if (chunkScore > 0) {
            matches.push({
              id: `${doc.id}-chunk-${matches.length}`,
              documentId: doc.id,
              title: doc.title,
              content: chunk,
              score: chunkScore / queryTerms.length // Normalize score
            });
            
            if (matches.length >= limit) break;
          }
        }
        
        if (matches.length >= limit) break;
      }
    }
    
    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('[EXTRACTOR] Error searching user documents:', error);
    return [];
  }
}
