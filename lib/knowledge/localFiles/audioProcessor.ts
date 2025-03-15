import { KnowledgeDocument } from '../../db/schema';
import { createKnowledgeChunk, updateKnowledgeDocument } from '../../db/queries';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { saveTranscript, getTranscript, getAudioFilePath } from './audioFileHandler';
import { WhisperTranscriptionResponse } from '../types/audio';
import { Buffer } from 'buffer';

// Create OpenAI client
const openai = new OpenAI();

interface ProcessAudioParams {
  document: KnowledgeDocument;
  audioFile: File | null;
  audioFilePath?: string;
  userId: string;
}

/**
 * Process an audio file by transcribing it with Whisper and creating embeddings
 */
export async function processAudioFile({
  document,
  audioFile,
  audioFilePath,
  userId,
}: ProcessAudioParams) {
  console.log(`\n[AUDIO PROCESSOR] Starting processing of audio file: "${document.title}" (${document.id})`);
  
  try {
    // Check if transcript already exists
    const existingTranscript = getTranscript(userId, document.id);
    if (existingTranscript) {
      console.log(`[AUDIO PROCESSOR] Transcript already exists, using cached data`);
      
      // Process the existing transcript
      await processTranscript(document, existingTranscript, userId);
      
      return { 
        success: true, 
        cached: true, 
        transcript: existingTranscript
      };
    }
    
    // Ensure we have a file path
    let finalAudioFilePath = audioFilePath;
    if (!finalAudioFilePath && audioFile) {
      // Create a temporary file
      const tempFilePath = path.join(
        process.cwd(),
        'temp',
        `${document.id}${path.extname(audioFile.name) || '.webm'}`
      );
      
      // Ensure the temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write the file
      const arrayBuffer = await audioFile.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
      finalAudioFilePath = tempFilePath;
    }
    
    if (!finalAudioFilePath) {
      throw new Error('No audio file provided for transcription');
    }
    
    // Use OpenAI Whisper API to transcribe the audio
    console.log(`[AUDIO PROCESSOR] Transcribing audio file: ${finalAudioFilePath}`);
    
    // Create a readable stream from the file
    const fileStream = fs.createReadStream(finalAudioFilePath);
    
    // Call Whisper API
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      temperature: 0,
      language: '', // Optional: specify language
    }) as unknown as WhisperTranscriptionResponse;
    
    console.log(`[AUDIO PROCESSOR] Transcription completed: ${transcriptionResponse.text.length} characters`);
    
    // Process for speaker diarization - in a real app, we would use a proper diarization API
    // For now, we'll simulate basic diarization by alternating speakers every few segments
    const enhancedTranscript = enhanceWithSimulatedDiarization(transcriptionResponse);
    
    // Save the transcript
    const savedTranscriptPath = saveTranscript(userId, document.id, enhancedTranscript);
    console.log(`[AUDIO PROCESSOR] Saved transcript to ${savedTranscriptPath}`);
    
    // Process the transcript
    await processTranscript(document, enhancedTranscript, userId);
    
    // Update document status to completed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'completed',
    });
    
    return { 
      success: true, 
      cached: false,
      transcript: enhancedTranscript
    };
  } catch (error) {
    console.error('[AUDIO PROCESSOR] Error processing audio:', error);
    
    // Update document status to failed
    await updateKnowledgeDocument({
      id: document.id,
      status: 'failed',
      processingError: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Process a transcript by chunking it and creating embeddings
 */
async function processTranscript(
  document: KnowledgeDocument,
  transcript: WhisperTranscriptionResponse, 
  userId: string
) {
  try {
    // Create a formatted text representation for chunking
    const formattedTranscript = formatTranscriptForStorage(transcript);
    
    // Split into chunks
    const chunks = splitTextIntoChunks(formattedTranscript);
    console.log(`[AUDIO PROCESSOR] Split transcript into ${chunks.length} chunks`);
    
    // Create embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[AUDIO PROCESSOR] Processing chunk ${i+1}/${chunks.length}`);
      
      // Generate embedding
      const embedding = await createEmbeddingWithAPI(chunk);
      
      // Store chunk and embedding in database
      await createKnowledgeChunk({
        documentId: document.id,
        content: chunk,
        metadata: {
          index: i,
          documentTitle: document.title,
          documentType: 'audio',
          isTranscript: true,
        },
        chunkIndex: i.toString(),
        embedding,
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
 * Format transcript for storage, including speaker information
 */
function formatTranscriptForStorage(transcript: WhisperTranscriptionResponse): string {
  let formattedText = `# Transcript of Audio Recording\n\n`;
  
  // Add metadata
  formattedText += `Language: ${transcript.language}\n`;
  formattedText += `Total segments: ${transcript.segments.length}\n\n`;
  
  // Format each segment with timestamps and speaker info
  transcript.segments.forEach(segment => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);
    const speaker = segment.speaker || 'Speaker';
    
    formattedText += `[${startTime} - ${endTime}] ${speaker}: ${segment.text}\n`;
  });
  
  return formattedText;
}

/**
 * Format seconds into MM:SS format
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Enhance transcript with simulated speaker diarization
 * In a production environment, this would use a proper diarization API
 */
function enhanceWithSimulatedDiarization(transcript: WhisperTranscriptionResponse): WhisperTranscriptionResponse {
  // Simply alternate between Speaker A and Speaker B every 2-3 segments
  let currentSpeaker = 'Speaker A';
  let segmentCount = 0;
  
  const enhancedSegments = transcript.segments.map(segment => {
    segmentCount++;
    
    // Switch speakers every 2-3 segments
    if (segmentCount > 2 && Math.random() > 0.5) {
      currentSpeaker = currentSpeaker === 'Speaker A' ? 'Speaker B' : 'Speaker A';
      segmentCount = 1;
    }
    
    return {
      ...segment,
      speaker: currentSpeaker
    };
  });
  
  return {
    ...transcript,
    segments: enhancedSegments
  };
}

// Import and re-export these functions from documentProcessor
import { splitTextIntoChunks, createEmbeddingWithAPI } from './documentProcessor';