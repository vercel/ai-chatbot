import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  createKnowledgeDocument, 
  getKnowledgeDocumentById 
} from '@/lib/db/queries';
import { saveAudioFile } from '@/lib/knowledge/localFiles/audioFileHandler';
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
    const audioFile = formData.get('file') as File;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
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
      fileSize: (audioFile.size / 1024).toFixed(2) + ' KB', // Store file size in KB format
      fileType: audioFile.type,
    });
    
    console.log(`Created audio document in database: ${document.id}`);
    
    // Save the audio file
    const filePath = await saveAudioFile(audioFile, session?.user?.id || '', document.id);
    console.log(`Saved audio file to ${filePath}`);

    // Start processing in the background
    processAudioFile({
      document,
      audioFile,
      audioFilePath: filePath,
      userId: session?.user?.id || ''
    }).catch(error => {
      console.error('Error processing audio file:', error);
    });

    return NextResponse.json({
      ...document,
      message: 'Audio file uploaded and processing started',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating audio document:', error);
    return NextResponse.json(
      { error: 'Failed to create audio document' },
      { status: 500 }
    );
  }
}