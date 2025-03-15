/**
 * This module provides fallback search results for the knowledge base
 * when database tables don't exist yet or when database searches fail.
 * 
 * This is a temporary measure to avoid errors during development and testing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { searchUserDocuments } from './contentExtractor';

// Get storage directories from environment
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(STORAGE_DIR, 'processed');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(STORAGE_DIR, 'uploads');

/**
 * Extracts text from an uploaded file if available
 */
function extractTextFromFile(userId: string, docId: string): string | null {
  try {
    // Look for original uploaded files
    const userUploadsDir = path.join(UPLOADS_DIR, userId);
    if (!fs.existsSync(userUploadsDir)) {
      console.log(`[FALLBACK] No uploads directory for user ${userId}`);
      return null;
    }
    
    const files = fs.readdirSync(userUploadsDir);
    
    // Find any files with this document ID as prefix
    const docFiles = files.filter(file => file.startsWith(docId));
    if (docFiles.length === 0) {
      console.log(`[FALLBACK] No uploaded files for document ${docId}`);
      return null;
    }
    
    const filePath = path.join(userUploadsDir, docFiles[0]);
    console.log(`[FALLBACK] Found uploaded file: ${filePath}`);
    
    // Simple text extraction based on file extension
    const fileExt = path.extname(filePath).toLowerCase();
    
    if (fileExt === '.txt') {
      // For text files, read directly
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } else if (fileExt === '.json') {
      // For JSON files, parse and extract text field if exists
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const json = JSON.parse(content);
        if (json.text || json.content) {
          return json.text || json.content;
        }
        // If no obvious text field, return stringify
        return JSON.stringify(json, null, 2);
      } catch (e) {
        return content; // If can't parse, return as is
      }
    } else {
      // For other files, just indicate the file was found but content can't be extracted
      return `File found (${fileExt}) but content extraction not supported. File size: ${fs.statSync(filePath).size} bytes.`;
    }
  } catch (error) {
    console.error(`[FALLBACK] Error extracting text from file:`, error);
    return null;
  }
}

/**
 * Searches for content in processed files that matches the query
 */
export function getFallbackResults(query: string, userId: string, limit: number = 5): Array<any> {
  console.log(`[FALLBACK] Searching local files for query: "${query.substring(0, 50)}..."`);
  
  try {
    // First try using the advanced document search
    console.log('[FALLBACK] Using content extractor search first');
    const extractorResults = searchUserDocuments(userId, query, limit);
    
    if (extractorResults.length > 0) {
      console.log(`[FALLBACK] Found ${extractorResults.length} results using content extractor`);
      return extractorResults;
    }
    
    // If that doesn't work, fall back to the original method
    console.log('[FALLBACK] No results from content extractor, trying basic file search');
    
    // Check if user directory exists
    const userDir = path.join(PROCESSED_DIR, userId);
    if (!fs.existsSync(userDir)) {
      console.log(`[FALLBACK] No processed files directory for user ${userId}`);
      return [];
    }
    
    // Get all processed files
    const files = fs.readdirSync(userDir);
    if (files.length === 0) {
      console.log('[FALLBACK] No processed files found');
      return [];
    }
    
    console.log(`[FALLBACK] Found ${files.length} processed files`);
    
    // Process each file to find matches
    const results: Array<any> = [];
    const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(userDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Use document ID as temporary result ID
        const docId = data.documentId || path.basename(file, '.json');
        
        // Check if document has useful content
        if (data.extractedTextLength && data.extractedTextLength > 0) {
          // Try to get actual content
          const extractedContent = extractTextFromFile(userId, docId);
          
          // Create a detailed result with available information
          const result = {
            id: `fallback-${docId}`,
            documentId: docId,
            title: data.title || 'Untitled Document',
            content: extractedContent || 
                    `This document contains ${data.chunkCount || 0} chunks of information ` +
                    `and was processed on ${new Date(data.processedAt || Date.now()).toLocaleDateString()}.`,
            url: '',
            score: 0.8, // Higher score for actual content
          };
          
          // Include chunk information if available
          if (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 0) {
            // Try to extract chunk contents for better results
            let chunksContent = '';
            const maxChunks = Math.min(data.chunks.length, 3); // Limit to 3 chunks for brevity
            
            for (let i = 0; i < maxChunks; i++) {
              const chunk = data.chunks[i];
              if (chunk.contentPreview) {
                chunksContent += `\nChunk ${i + 1}: ${chunk.contentPreview}`;
              }
            }
            
            if (chunksContent && !extractedContent) {
              result.content += '\n\nChunks preview:' + chunksContent;
            }
          }
          
          results.push(result);
          
          if (results.length >= limit) {
            break;
          }
        }
      } catch (fileError) {
        console.error(`[FALLBACK] Error processing file ${file}:`, fileError);
      }
    }
    
    console.log(`[FALLBACK] Found ${results.length} relevant results`);
    return results;
  } catch (error) {
    console.error('[FALLBACK] Error in fallback search:', error);
    return [];
  }
}
