import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Define the directory paths
const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const RECORDINGS_DIR = path.join(STORAGE_ROOT, 'recordings');
const TEXTS_DIR = path.join(STORAGE_ROOT, 'texts');
const NOTES_DIR = path.join(STORAGE_ROOT, 'notes');

// Ensure all directories exist
export function ensureDirectories() {
  [STORAGE_ROOT, RECORDINGS_DIR, TEXTS_DIR, NOTES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Process stored files that haven't been processed yet
export async function processStoredFiles() {
  ensureDirectories();
  
  let processed = 0;
  let failed = 0;
  
  // Process recordings
  const recordingFiles = fs.readdirSync(RECORDINGS_DIR);
  for (const file of recordingFiles) {
    if (file.endsWith('.json')) {
      try {
        const metadataPath = path.join(RECORDINGS_DIR, file);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Check if this is from the extension and not processed
        if (metadata.source === 'chrome_extension' && !metadata.processed) {
          console.log(`Processing stored recording: ${metadata.title}`);
          
          // Mark as processed
          metadata.processed = true;
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
          
          // TODO: Additional processing like transcription could be done here
          
          processed++;
        }
      } catch (error) {
        console.error(`Error processing recording file ${file}:`, error);
        failed++;
      }
    }
  }
  
  // Process texts
  const textFiles = fs.readdirSync(TEXTS_DIR);
  for (const file of textFiles) {
    if (file.endsWith('.json')) {
      try {
        const metadataPath = path.join(TEXTS_DIR, file);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Check if this is from the extension and not processed
        if (metadata.source === 'chrome_extension' && !metadata.processed) {
          console.log(`Processing stored text: ${metadata.title}`);
          
          // Mark as processed
          metadata.processed = true;
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
          
          // TODO: Additional processing could be done here
          
          processed++;
        }
      } catch (error) {
        console.error(`Error processing text file ${file}:`, error);
        failed++;
      }
    }
  }
  
  // Process notes
  const noteFiles = fs.readdirSync(NOTES_DIR);
  for (const file of noteFiles) {
    if (file.endsWith('.json')) {
      try {
        const metadataPath = path.join(NOTES_DIR, file);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Check if this is from the extension and not processed
        if (metadata.source === 'chrome_extension' && !metadata.processed) {
          console.log(`Processing stored note: ${metadata.id}`);
          
          // Mark as processed
          metadata.processed = true;
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
          
          // TODO: Additional processing could be done here
          
          processed++;
        }
      } catch (error) {
        console.error(`Error processing note file ${file}:`, error);
        failed++;
      }
    }
  }
  
  return { processed, failed };
}

// Get list of unprocessed files
export function getUnprocessedFiles() {
  ensureDirectories();
  
  const files = {
    recordings: [] as any[],
    texts: [] as any[],
    notes: [] as any[]
  };
  
  // Scan recordings
  try {
    const recordingFiles = fs.readdirSync(RECORDINGS_DIR);
    for (const file of recordingFiles) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(RECORDINGS_DIR, file);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          if (metadata.source === 'chrome_extension' && !metadata.processed) {
            files.recordings.push({
              name: metadata.title || 'Unnamed Recording',
              path: metadataPath,
              type: 'recording',
              timestamp: new Date(metadata.timestamp || Date.now())
            });
          }
        } catch (error) {
          console.error(`Error reading recording metadata ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning recordings directory:', error);
  }
  
  // Scan texts
  try {
    const textFiles = fs.readdirSync(TEXTS_DIR);
    for (const file of textFiles) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(TEXTS_DIR, file);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          if (metadata.source === 'chrome_extension' && !metadata.processed) {
            files.texts.push({
              name: metadata.title || 'Unnamed Text',
              path: metadataPath,
              type: 'text',
              timestamp: new Date(metadata.timestamp || Date.now())
            });
          }
        } catch (error) {
          console.error(`Error reading text metadata ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning texts directory:', error);
  }
  
  // Scan notes
  try {
    const noteFiles = fs.readdirSync(NOTES_DIR);
    for (const file of noteFiles) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(NOTES_DIR, file);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          if (metadata.source === 'chrome_extension' && !metadata.processed) {
            files.notes.push({
              name: `Note ${new Date(metadata.timestamp || Date.now()).toLocaleString()}`,
              path: metadataPath,
              type: 'note',
              timestamp: new Date(metadata.timestamp || Date.now())
            });
          }
        } catch (error) {
          console.error(`Error reading note metadata ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error scanning notes directory:', error);
  }
  
  return files;
}