import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';

/**
 * Extension knowledge synchronization endpoint for audio recordings
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { userId, recordings, clientTimestamp } = await request.json();
    
    // Verify the user ID matches the authenticated user
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    if (!recordings || !Array.isArray(recordings) || recordings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recordings to sync' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${recordings.length} recordings from extension`);
    
    const syncedIds: number[] = [];
    const errors: { id: number, error: string }[] = [];
    
    // Process each recording
    for (const recording of recordings) {
      try {
        // Create a knowledge document for the recording
        const document = await createKnowledgeDocument({
          userId: session.user.id,
          title: recording.title || 'Recording from extension',
          description: 'Synchronized from Chrome extension',
          sourceType: 'audio',
          sourceUrl: '',
          fileSize: '',
          fileType: 'audio/webm',
        });
        
        // Save the audio file
        // This is a simplified approach - in a production system,
        // you'd want to save the audio file to storage and then
        // process it with proper audio transcription
        
        // Get audio data from base64
        const audioData = recording.audio.split(',')[1]; // Remove the data URL prefix
        const buffer = Buffer.from(audioData, 'base64');
        
        // Process the document
        // Note: In a real system, this would involve saving the audio file
        // and then processing it through transcription
        try {
          processDocumentLocal({
            document,
            content: `Audio recording: ${recording.title || 'Untitled'}`,
            userId: session.user.id,
            audioBuffer: buffer
          }).catch(processingError => {
            console.error('Error in background document processing:', processingError);
          });
        } catch (processingError) {
          console.error('Error setting up document processing:', processingError);
          // Continue processing other recordings
        }
        
        // Mark this recording as synced
        syncedIds.push(recording.id);
      } catch (recordingError) {
        console.error(`Error processing recording ${recording.id}:`, recordingError);
        errors.push({ id: recording.id, error: recordingError.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedIds,
      errors,
      syncTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in extension knowledge sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Synchronization failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
