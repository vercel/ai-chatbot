/**
 * Audio processor module for handling audio files and transcription
 */
import fs from 'fs';
import path from 'path';
import { createKnowledgeChunk, updateKnowledgeDocument } from '@/lib/db/queries';
import speechmaticsClient from './client';

/**
 * Process an audio file by saving it, transcribing it, and creating chunks
 * 
 * @param {Object} params - Processing parameters
 * @param {string} params.documentId - The document ID
 * @param {File|Buffer} params.audioFile - The audio file
 * @param {string} params.userId - The user ID
 * @returns {Promise<Object>} - Processing result
 * @param {string} params.language - The language code for transcription
 */
export async function processAudioFile({ documentId, audioFile, userId, language = 'en' }) {
  console.log(`\n[AUDIO PROCESSOR] Starting processing of audio file for document ${documentId}`);
  
  try {
    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'storage');
    const audioDir = path.join(storageDir, 'audio');
    
    for (const dir of [storageDir, audioDir]) {
      if (!fs.existsSync(dir)) {
        console.log(`[AUDIO PROCESSOR] Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Create a user-specific directory
    const userDir = path.join(audioDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Save the audio file
    let audioBuffer;
    let filename;
    
    if (audioFile instanceof Buffer) {
      // Node.js Buffer
      audioBuffer = audioFile;
      filename = `${documentId}.mp3`; // Default extension
    } else {
      // Browser File/Blob
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
      filename = audioFile.name || `${documentId}.mp3`;
    }
    
    const filePath = path.join(userDir, `${documentId}${path.extname(filename)}`);
    fs.writeFileSync(filePath, audioBuffer);
    console.log(`[AUDIO PROCESSOR] Saved audio file to ${filePath}`);
    
    // Update document status to processing
    await updateKnowledgeDocument({
      id: documentId,
      status: 'processing',
    });
    
    // Transcribe the audio using Speechmatics
    console.log(`[AUDIO PROCESSOR] Transcribing audio file with Speechmatics (Language: ${language})`);
    
    try {
      const transcriptData = await speechmaticsClient.transcribeAudio(audioBuffer, {
        filename: path.basename(filePath),
        language
      });
      
      // Format the transcript to readable text
      const formattedTranscript = speechmaticsClient.formatTranscript(transcriptData);
      console.log(`[AUDIO PROCESSOR] Transcription complete: ${formattedTranscript.length} characters`);
      
      // Save transcript to file for potential later reference
      const transcriptDir = path.join(storageDir, 'transcripts');
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }
      
      const transcriptPath = path.join(transcriptDir, `${documentId}.txt`);
      fs.writeFileSync(transcriptPath, formattedTranscript);
      console.log(`[AUDIO PROCESSOR] Saved transcript to ${transcriptPath}`);
      
      // Process and store the transcript chunks
      await processTranscript(documentId, formattedTranscript);
      
      // Update document status to completed and save transcript character count if column exists
      try {
        const updateData = {
          id: documentId,
          status: 'completed',
          transcriptCharCount: `${formattedTranscript.length} chars`
        };
        
        // Try to update with the character count
        await updateKnowledgeDocument(updateData);
      } catch (updateError) {
        // If updating with transcriptCharCount fails, try without it
        // This happens when the column doesn't exist yet
        try {
          await updateKnowledgeDocument({
            id: documentId,
            status: 'completed'
          });
          console.log(`[AUDIO PROCESSOR] Updated status to completed (without char count)`);  
        } catch (fallbackError) {
          console.error('[AUDIO PROCESSOR] Error updating document status:', fallbackError);
        }
      }
      
      console.log(`[AUDIO PROCESSOR] Audio processing completed successfully for document ${documentId}`);
      return { success: true };
    } catch (transcriptionError) {
      console.error('[AUDIO PROCESSOR] Transcription error:', transcriptionError);
      
      // Update document status to failed
      await updateKnowledgeDocument({
        id: documentId,
        status: 'failed',
        processingError: transcriptionError.message || 'Transcription failed',
      });
      
      throw transcriptionError;
    }
  } catch (error) {
    console.error('[AUDIO PROCESSOR] Error processing audio:', error);
    
    // Update document status to failed if not already updated
    try {
      await updateKnowledgeDocument({
        id: documentId,
        status: 'failed',
        processingError: error.message || 'Unknown error',
      });
    } catch (updateError) {
      console.error('[AUDIO PROCESSOR] Error updating document status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Process a transcript by chunking it and creating embeddings
 * 
 * @param {string} documentId - The document ID
 * @param {string} transcript - The formatted transcript
 * @returns {Promise<boolean>} - Processing result
 */
async function processTranscript(documentId, transcript) {
  try {
    // Split into chunks
    const chunks = splitTextIntoChunks(transcript);
    console.log(`[AUDIO PROCESSOR] Split transcript into ${chunks.length} chunks`);
    
    // Create chunks in database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[AUDIO PROCESSOR] Processing chunk ${i+1}/${chunks.length}`);
      
      await createKnowledgeChunk({
        documentId,
        content: chunk,
        metadata: {
          index: i,
          isTranscript: true,
        },
        chunkIndex: i.toString(),
        embedding: [], // Empty embedding for simplicity
      });
      
      console.log(`[AUDIO PROCESSOR] Stored chunk ${i+1} in database`);
    }
    
    return true;
  } catch (error) {
    console.error('[AUDIO PROCESSOR] Error processing transcript:', error);
    throw error;
  }
}

/**
 * Split text into chunks of 3500 characters max
 * 
 * @param {string} text - The text to split
 * @returns {string[]} - Array of chunks
 */
function splitTextIntoChunks(text) {
  // If text is very short, return it as a single chunk
  if (text.length < 3500) {
    return [text];
  }
  
  // Try to split by speaker
  const speakerPattern = /Speaker \w+:/;
  const speakerChunks = text.split(new RegExp(`(?=${speakerPattern.source})`, 'g'))
    .filter(chunk => chunk.trim());
  
  if (speakerChunks.length > 1) {
    const finalChunks = [];
    let currentChunk = '';
    
    for (const speakerChunk of speakerChunks) {
      if (currentChunk.length + speakerChunk.length > 3500) {
        finalChunks.push(currentChunk.trim());
        currentChunk = speakerChunk;
      } else {
        currentChunk += speakerChunk;
      }
    }
    
    if (currentChunk.trim()) {
      finalChunks.push(currentChunk.trim());
    }
    
    return finalChunks;
  }
  
  // Fallback to paragraph splits if speaker splitting doesn't work well
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > 3500) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length ? chunks : [text];
}
