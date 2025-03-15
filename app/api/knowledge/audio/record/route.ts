import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { saveRecordedAudio } from '@/lib/knowledge/localFiles/audioFileHandler';
import { processAudioFile } from '@/lib/knowledge/localFiles/audioProcessor';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const audioBlob = formData.get('audioBlob') as Blob;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Audio recording is required' },
        { status: 400 }
      );
    }

    // Create the document in the database
    const document = await createKnowledgeDocument({
      userId: session?.user?.id || '',
      title,
      description,
      sourceType: 'audio',
      sourceUrl: '',
      fileSize: (audioBlob.size / 1024).toFixed(2) + ' KB',
      fileType: audioBlob.type,
    });
    
    console.log(`Created recorded audio document in database: ${document.id}`);
    
    // Create a File object from the Blob
    const file = new File([audioBlob], `recording-${document.id}.webm`, { 
      type: 'audio/webm' 
    });
    
    // Save the audio file
    const filePath = await saveRecordedAudio(audioBlob, session?.user?.id || '', document.id);
    console.log(`Saved recorded audio to ${filePath}`);

    // Start processing in the background
    processAudioFile({
      document,
      audioFile: file,
      audioFilePath: filePath,
      userId: session?.user?.id || ''
    }).catch(error => {
      console.error('Error processing recorded audio:', error);
    });

    return NextResponse.json({
      ...document,
      message: 'Recorded audio uploaded and processing started',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recorded audio document:', error);
    return NextResponse.json(
      { error: 'Failed to create recorded audio document' },
      { status: 500 }
    );
  }
}