import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { saveRecordedAudio } from '@/lib/knowledge/localFiles/audioFileHandler';
import { processAudioFile } from '@/lib/knowledge/localFiles/audioProcessor';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for adding recorded audio to the knowledge base
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[API] Audio recording upload request started: ${requestId}`);
  
  try {
    // Get user session
    const session = await auth();
    
    if (!session?.user) {
      console.log(`[API] Unauthorized access attempt: ${requestId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`[API] Authenticated user: ${userId}`);
    
    // Parse form data
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const audioBlob = formData.get('audioBlob') as Blob;
    
    if (!title) {
      console.log(`[API] Missing title: ${requestId}`);
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!audioBlob) {
      console.log(`[API] Missing audio recording: ${requestId}`);
      return NextResponse.json(
        { error: 'Audio recording is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Creating audio recording document: ${title} (${audioBlob.size} bytes)`);
    
    // Create document in database
    const document = await createKnowledgeDocument({
      userId,
      title,
      description,
      sourceType: 'audio',
      sourceUrl: '',
      fileSize: (audioBlob.size / 1024).toFixed(2) + ' KB',
      fileType: audioBlob.type || 'audio/webm',
    });
    
    console.log(`[API] Audio recording document created: ${document.id}`);
    
    // Save the audio recording
    const filePath = await saveRecordedAudio(audioBlob, userId, document.id);
    console.log(`[API] Saved audio recording to ${filePath}`);
    
    // Create a File object from the Blob for processing
    const file = new File([audioBlob], `recording-${document.id}.webm`, { 
      type: 'audio/webm' 
    });
    
    // Process audio recording asynchronously
    processAudioFile({
      document,
      audioFile: file,
      audioFilePath: filePath,
      userId
    }).catch(error => {
      console.error(`[API] Error processing audio recording: ${error.message}`);
    });
    
    return NextResponse.json({
      id: document.id,
      title: document.title,
      createdAt: document.createdAt,
      status: document.status,
      message: 'Audio recording uploaded and processing started'
    }, { status: 201 });
    
  } catch (error) {
    console.error(`[API] Unexpected error: ${error.message}`);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}