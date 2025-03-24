import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { saveAudioFile } from '@/lib/knowledge/localFiles/audioFileHandler';
import { processAudioFile } from '@/lib/knowledge/localFiles/audioProcessor';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for adding audio files to the knowledge base
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[API] Audio upload request started: ${requestId}`);
  
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
    const audioFile = formData.get('file') as File;
    
    if (!title) {
      console.log(`[API] Missing title: ${requestId}`);
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!audioFile) {
      console.log(`[API] Missing audio file: ${requestId}`);
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Creating audio document: ${title} (${audioFile.name})`);
    
    // Create document in database
    const document = await createKnowledgeDocument({
      userId,
      title,
      description,
      sourceType: 'audio',
      sourceUrl: '',
      fileSize: (audioFile.size / 1024).toFixed(2) + ' KB',
      fileType: audioFile.type || 'audio/unknown',
    });
    
    console.log(`[API] Audio document created: ${document.id}`);
    
    // Save the audio file
    const filePath = await saveAudioFile(audioFile, userId, document.id);
    console.log(`[API] Saved audio file to ${filePath}`);
    
    // Process audio file asynchronously
    processAudioFile({
      document,
      audioFile,
      audioFilePath: filePath,
      userId
    }).catch(error => {
      console.error(`[API] Error processing audio file: ${error.message}`);
    });
    
    return NextResponse.json({
      id: document.id,
      title: document.title,
      createdAt: document.createdAt,
      status: document.status,
      message: 'Audio file uploaded and processing started'
    }, { status: 201 });
    
  } catch (error) {
    console.error(`[API] Unexpected error: ${error.message}`);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}