import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { saveProcessedContent, getProcessedFilePath } from './fileHandler';

// Get paths from environment variables with fallbacks
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const AUDIO_DIR = process.env.AUDIO_DIR || path.join(STORAGE_DIR, 'audio');
const TRANSCRIPTS_DIR = process.env.TRANSCRIPTS_DIR || path.join(STORAGE_DIR, 'transcripts');

// Ensure directories exist
for (const dir of [STORAGE_DIR, AUDIO_DIR, TRANSCRIPTS_DIR]) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates a file path for an audio file based on user ID and document ID
 */
export function getAudioFilePath(userId: string, documentId: string, originalName: string): string {
  // Get file extension or default to .webm
  const ext = path.extname(originalName) || '.webm';
  // Create a subdirectory for this user
  const userDir = path.join(AUDIO_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate path
  return path.join(userDir, `${documentId}${ext}`);
}

/**
 * Saves an audio file to the local storage system
 */
export async function saveAudioFile(file: File, userId: string, documentId: string): Promise<string> {
  try {
    // Generate file path
    const filePath = getAudioFilePath(userId, documentId, file.name);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to file system
    fs.writeFileSync(filePath, buffer);
    console.log(`[AUDIO HANDLER] Saved audio file to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('[AUDIO HANDLER] Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
}

/**
 * Save raw audio data from recorder
 */
export function saveRecordedAudio(audioBlob: Blob, userId: string, documentId: string): Promise<string> {
  return saveAudioFile(
    new File([audioBlob], `recording-${documentId}.webm`, { type: 'audio/webm' }), 
    userId, 
    documentId
  );
}

/**
 * Gets the path for an audio transcript JSON file
 */
export function getTranscriptFilePath(userId: string, documentId: string): string {
  // Create a subdirectory for this user
  const userDir = path.join(TRANSCRIPTS_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate path
  return path.join(userDir, `${documentId}.json`);
}

/**
 * Saves a transcript for an audio file
 */
export function saveTranscript(userId: string, documentId: string, transcript: any): string {
  try {
    const filePath = getTranscriptFilePath(userId, documentId);
    fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
    console.log(`[AUDIO HANDLER] Saved transcript to ${filePath}`);
    
    // Also save as processed content to integrate with the existing system
    saveProcessedContent(userId, documentId, {
      documentId,
      transcription: transcript,
      processedAt: new Date().toISOString(),
    });
    
    return filePath;
  } catch (error) {
    console.error('[AUDIO HANDLER] Error saving transcript:', error);
    throw new Error('Failed to save transcript');
  }
}

/**
 * Gets a transcript for an audio file if it exists
 */
export function getTranscript(userId: string, documentId: string): any | null {
  try {
    const filePath = getTranscriptFilePath(userId, documentId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[AUDIO HANDLER] Error reading transcript:', error);
    return null;
  }
}

/**
 * Gets the audio file URL for a stored audio file
 */
export function getAudioFileUrl(userId: string, documentId: string): string {
  // This would be a route that serves the audio file
  return `/api/knowledge/${documentId}/audio`;
}