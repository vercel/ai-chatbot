// Create a user-specific directory structure for files
function getUserDataPaths(userId: string) {
  const userPath = path.join(STORAGE_ROOT, 'users', userId);
  return {
    root: userPath,
    recordings: path.join(userPath, 'recordings'),
    texts: path.join(userPath, 'texts'),
    notes: path.join(userPath, 'notes')
  };
}import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Define the directory paths
const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const OFFLINE_TEMP_DIR = path.join(STORAGE_ROOT, 'offline-temp-files');
const RECORDINGS_DIR = path.join(STORAGE_ROOT, 'recordings');
const TEXTS_DIR = path.join(STORAGE_ROOT, 'texts');
const NOTES_DIR = path.join(STORAGE_ROOT, 'notes');

// File validation limits
const MAX_TEXT_LENGTH = 50000; // 50K characters
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB for audio data
const SUPPORTED_FORMATS = ['text', 'recording', 'note'];

// Ensure all directories exist
export function ensureOfflineDirectories() {
  [STORAGE_ROOT, OFFLINE_TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Create type-specific directories
  ['recordings', 'texts', 'notes'].forEach(type => {
    const dir = path.join(OFFLINE_TEMP_DIR, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Ensure user directories exist
export function ensureUserDirectories(userId: string) {
  if (!userId) return;
  
  const userPaths = getUserDataPaths(userId);
  
  [userPaths.root, userPaths.recordings, userPaths.texts, userPaths.notes].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Process files from offline temp directory
export async function processOfflineTempFiles() {
  ensureOfflineDirectories();
  
  const result = {
    processed: 0,
    failed: 0,
    errors: [] as { id: string; type: string; error: string }[]
  };
  
  // Process recordings
  const recordingFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'recordings'));
  
  for (const file of recordingFiles) {
    if (file.endsWith('.json')) {
      try {
        const sourcePath = path.join(OFFLINE_TEMP_DIR, 'recordings', file);
        const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        
        // Ensure the user ID exists
        if (!fileData.userId) {
          throw new Error('User ID is missing');
        }
        
        // Ensure user directories
        ensureUserDirectories(fileData.userId);
        
        // Create user-specific paths
        const userPaths = getUserDataPaths(fileData.userId);
        
        // Perform validation
        let validationError = validateRecording(fileData);
        if (validationError) {
          // Update the file with the error
          fileData.processingError = validationError;
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id,
            type: 'recording',
            error: validationError
          });
          
          result.failed++;
          continue;
        }
        
        // Create destination path
        const destPath = path.join(RECORDINGS_DIR, `${fileData.id}.json`);
        
        // Update metadata
        fileData.processed = true;
        fileData.processingTimestamp = new Date().toISOString();
        fileData.movedFromOfflineTemp = true;
        
        // Save the processed file to the destination directory
        fs.writeFileSync(destPath, JSON.stringify(fileData, null, 2), 'utf8');
        
        // Optionally remove from temp directory or mark as processed
        fs.unlinkSync(sourcePath);
        
        console.log(`Processed offline recording: ${fileData.title || fileData.id}`);
        result.processed++;
      } catch (error) {
        console.error(`Error processing offline recording file ${file}:`, error);
        result.failed++;
        
        try {
          // Update the file with the error
          const sourcePath = path.join(OFFLINE_TEMP_DIR, 'recordings', file);
          const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          fileData.processingError = error instanceof Error ? error.message : String(error);
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id || path.basename(file, '.json'),
            type: 'recording',
            error: error instanceof Error ? error.message : String(error)
          });
        } catch (updateError) {
          console.error(`Failed to update error status in recording file ${file}:`, updateError);
        }
      }
    }
  }
  
  // Process texts
  const textFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'texts'));
  
  for (const file of textFiles) {
    if (file.endsWith('.json')) {
      try {
        const sourcePath = path.join(OFFLINE_TEMP_DIR, 'texts', file);
        const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        
        // Perform validation
        let validationError = validateText(fileData);
        if (validationError) {
          // Update the file with the error
          fileData.processingError = validationError;
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id,
            type: 'text',
            error: validationError
          });
          
          result.failed++;
          continue;
        }
        
        // Create destination path
        const destPath = path.join(TEXTS_DIR, `${fileData.id}.json`);
        
        // Update metadata
        fileData.processed = true;
        fileData.processingTimestamp = new Date().toISOString();
        fileData.movedFromOfflineTemp = true;
        
        // Save the processed file to the destination directory
        fs.writeFileSync(destPath, JSON.stringify(fileData, null, 2), 'utf8');
        
        // Optionally remove from temp directory or mark as processed
        fs.unlinkSync(sourcePath);
        
        console.log(`Processed offline text: ${fileData.title || fileData.id}`);
        result.processed++;
      } catch (error) {
        console.error(`Error processing offline text file ${file}:`, error);
        result.failed++;
        
        try {
          // Update the file with the error
          const sourcePath = path.join(OFFLINE_TEMP_DIR, 'texts', file);
          const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          fileData.processingError = error instanceof Error ? error.message : String(error);
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id || path.basename(file, '.json'),
            type: 'text',
            error: error instanceof Error ? error.message : String(error)
          });
        } catch (updateError) {
          console.error(`Failed to update error status in text file ${file}:`, updateError);
        }
      }
    }
  }
  
  // Process notes
  const noteFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'notes'));
  
  for (const file of noteFiles) {
    if (file.endsWith('.json')) {
      try {
        const sourcePath = path.join(OFFLINE_TEMP_DIR, 'notes', file);
        const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        
        // Perform validation
        let validationError = validateNote(fileData);
        if (validationError) {
          // Update the file with the error
          fileData.processingError = validationError;
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id,
            type: 'note',
            error: validationError
          });
          
          result.failed++;
          continue;
        }
        
        // Create destination path
        const destPath = path.join(NOTES_DIR, `${fileData.id}.json`);
        
        // Update metadata
        fileData.processed = true;
        fileData.processingTimestamp = new Date().toISOString();
        fileData.movedFromOfflineTemp = true;
        
        // Save the processed file to the destination directory
        fs.writeFileSync(destPath, JSON.stringify(fileData, null, 2), 'utf8');
        
        // Optionally remove from temp directory or mark as processed
        fs.unlinkSync(sourcePath);
        
        console.log(`Processed offline note: ${fileData.id}`);
        result.processed++;
      } catch (error) {
        console.error(`Error processing offline note file ${file}:`, error);
        result.failed++;
        
        try {
          // Update the file with the error
          const sourcePath = path.join(OFFLINE_TEMP_DIR, 'notes', file);
          const fileData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          fileData.processingError = error instanceof Error ? error.message : String(error);
          fileData.processed = false;
          fileData.processingTimestamp = new Date().toISOString();
          fs.writeFileSync(sourcePath, JSON.stringify(fileData, null, 2), 'utf8');
          
          result.errors.push({
            id: fileData.id || path.basename(file, '.json'),
            type: 'note',
            error: error instanceof Error ? error.message : String(error)
          });
        } catch (updateError) {
          console.error(`Failed to update error status in note file ${file}:`, updateError);
        }
      }
    }
  }
  
  return result;
}

// Get all offline files with their status
export function getOfflineFiles() {
  ensureOfflineDirectories();
  
  const files = {
    recordings: [] as any[],
    texts: [] as any[],
    notes: [] as any[],
    all: [] as any[]
  };
  
  // Scan recordings
  try {
    const recordingFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'recordings'));
    for (const file of recordingFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(OFFLINE_TEMP_DIR, 'recordings', file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const fileInfo = {
            id: fileData.id,
            name: fileData.title || 'Unnamed Recording',
            path: filePath,
            type: 'recording',
            timestamp: new Date(fileData.timestamp || Date.now()),
            processed: fileData.processed || false,
            error: fileData.processingError || null,
            processingTimestamp: fileData.processingTimestamp || null
          };
          
          files.recordings.push(fileInfo);
          files.all.push(fileInfo);
        } catch (error) {
          console.error(`Error reading recording file ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning recordings directory:', error);
  }
  
  // Scan texts
  try {
    const textFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'texts'));
    for (const file of textFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(OFFLINE_TEMP_DIR, 'texts', file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const fileInfo = {
            id: fileData.id,
            name: fileData.title || 'Unnamed Text',
            path: filePath,
            type: 'text',
            timestamp: new Date(fileData.timestamp || Date.now()),
            processed: fileData.processed || false,
            error: fileData.processingError || null,
            processingTimestamp: fileData.processingTimestamp || null
          };
          
          files.texts.push(fileInfo);
          files.all.push(fileInfo);
        } catch (error) {
          console.error(`Error reading text file ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning texts directory:', error);
  }
  
  // Scan notes
  try {
    const noteFiles = fs.readdirSync(path.join(OFFLINE_TEMP_DIR, 'notes'));
    for (const file of noteFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(OFFLINE_TEMP_DIR, 'notes', file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const fileInfo = {
            id: fileData.id,
            name: `Note ${new Date(fileData.timestamp || Date.now()).toLocaleString()}`,
            path: filePath,
            type: 'note',
            timestamp: new Date(fileData.timestamp || Date.now()),
            processed: fileData.processed || false,
            error: fileData.processingError || null,
            processingTimestamp: fileData.processingTimestamp || null
          };
          
          files.notes.push(fileInfo);
          files.all.push(fileInfo);
        } catch (error) {
          console.error(`Error reading note file ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning notes directory:', error);
  }
  
  // Sort all files by timestamp, newest first
  files.all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return files;
}

// Validation functions
interface RecordingData {
  id: string;
  audio?: string;
}

function validateRecording(data: RecordingData): string | null {
  if (!data.id) return 'Missing ID';
  if (!data.audio) return 'Missing audio data';
  
  // Check if audio data is too large
  if (data.audio.length > MAX_AUDIO_SIZE) {
    return `Audio size exceeds maximum allowed (${Math.round(MAX_AUDIO_SIZE / 1024 / 1024)}MB)`;
  }
  
  return null; // No errors
}

interface TextData {
  id: string;
  content?: string;
}

function validateText(data: TextData): string | null {
  if (!data.id) return 'Missing ID';
  if (!data.content) return 'Missing text content';
  
  // Check if text is too long
  if (data.content.length > MAX_TEXT_LENGTH) {
    return `Text length exceeds maximum allowed (${MAX_TEXT_LENGTH} characters)`;
  }
  
  return null; // No errors
}

interface NoteData {
  id: string;
  content?: string;
}

function validateNote(data: NoteData): string | null {
  if (!data.id) return 'Missing ID';
  if (!data.content) return 'Missing note content';
  
  // Check if text is too long
  if (data.content.length > MAX_TEXT_LENGTH) {
    return `Note length exceeds maximum allowed (${MAX_TEXT_LENGTH} characters)`;
  }
  
  return null; // No errors
}