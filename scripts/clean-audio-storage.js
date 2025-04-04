const fs = require('fs');
const path = require('path');

// Get storage paths from environment variables or use default paths
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const AUDIO_DIR = process.env.AUDIO_DIR || path.join(STORAGE_DIR, 'audio');
const TRANSCRIPTS_DIR = process.env.TRANSCRIPTS_DIR || path.join(STORAGE_DIR, 'transcripts');

console.log('Starting audio storage cleanup...');

// Check if the audio directory exists
if (fs.existsSync(AUDIO_DIR)) {
  console.log(`Audio directory found at: ${AUDIO_DIR}`);
  
  // Get all user directories in the audio folder
  const userDirs = fs.readdirSync(AUDIO_DIR);
  console.log(`Found ${userDirs.length} user directories`);
  
  // Loop through each user directory and delete audio files
  userDirs.forEach(userId => {
    const userDir = path.join(AUDIO_DIR, userId);
    
    // Make sure it's a directory
    if (fs.statSync(userDir).isDirectory()) {
      console.log(`Processing user directory: ${userId}`);
      
      // Get all files in the user's audio directory
      const files = fs.readdirSync(userDir);
      console.log(`Found ${files.length} audio files for user ${userId}`);
      
      // Delete each audio file
      files.forEach(file => {
        const filePath = path.join(userDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting ${filePath}:`, error.message);
        }
      });
      
      // Try to remove the now-empty directory
      try {
        fs.rmdirSync(userDir);
        console.log(`Removed empty directory: ${userDir}`);
      } catch (error) {
        console.log(`Could not remove directory ${userDir}: ${error.message}`);
      }
    }
  });
  
  // Try to remove the audio directory if it's empty
  try {
    fs.rmdirSync(AUDIO_DIR);
    console.log(`Removed empty audio directory: ${AUDIO_DIR}`);
  } catch (error) {
    console.log(`Could not remove audio directory: ${error.message}`);
  }
} else {
  console.log(`Audio directory not found at: ${AUDIO_DIR}`);
}

// Check if the transcripts directory exists
if (fs.existsSync(TRANSCRIPTS_DIR)) {
  console.log(`Transcripts directory found at: ${TRANSCRIPTS_DIR}`);
  
  // Get all user directories in the transcripts folder
  const userDirs = fs.readdirSync(TRANSCRIPTS_DIR);
  console.log(`Found ${userDirs.length} user directories in transcripts`);
  
  // Loop through each user directory and delete transcript files
  userDirs.forEach(userId => {
    const userDir = path.join(TRANSCRIPTS_DIR, userId);
    
    // Make sure it's a directory
    if (fs.statSync(userDir).isDirectory()) {
      console.log(`Processing user transcript directory: ${userId}`);
      
      // Get all files in the user's transcript directory
      const files = fs.readdirSync(userDir);
      console.log(`Found ${files.length} transcript files for user ${userId}`);
      
      // Delete each transcript file
      files.forEach(file => {
        const filePath = path.join(userDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting ${filePath}:`, error.message);
        }
      });
      
      // Try to remove the now-empty directory
      try {
        fs.rmdirSync(userDir);
        console.log(`Removed empty directory: ${userDir}`);
      } catch (error) {
        console.log(`Could not remove directory ${userDir}: ${error.message}`);
      }
    }
  });
  
  // Try to remove the transcripts directory if it's empty
  try {
    fs.rmdirSync(TRANSCRIPTS_DIR);
    console.log(`Removed empty transcripts directory: ${TRANSCRIPTS_DIR}`);
  } catch (error) {
    console.log(`Could not remove transcripts directory: ${error.message}`);
  }
} else {
  console.log(`Transcripts directory not found at: ${TRANSCRIPTS_DIR}`);
}

console.log('Audio storage cleanup completed.');
