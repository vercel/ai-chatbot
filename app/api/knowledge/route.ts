import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument, getKnowledgeDocumentsByUserId } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';
import { saveUploadedFile } from '@/lib/knowledge/localFiles/fileHandler';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documents = await getKnowledgeDocumentsByUserId({
      userId: session.user.id,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge documents' },
      { status: 500 }
    );
  }
}

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
    const description = formData.get('description') as string;
    const sourceType = formData.get('sourceType') as string;
    
    if (!title || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // We only support 'text' source type in this simplified version
    if (sourceType !== 'text') {
      return NextResponse.json(
        { error: 'Only text content is supported' },
        { status: 400 }
      );
    }

    const content = formData.get('content') as string;
    if (!content) {
      return NextResponse.json(
        { error: 'Missing content for text document' },
        { status: 400 }
      );
    }

    // Create the document in the database
    const document = await createKnowledgeDocument({
      userId: session.user.id,
      title,
      description,
      sourceType: 'text',
      sourceUrl: '',
      fileSize: '',
      fileType: '',
    });
    
    console.log(`Created knowledge document in database: ${document.id}`);

    // Process the document asynchronously
    try {
      // Start processing in the background
      processDocumentLocal({
        document,
        content,
        userId: session.user.id
      }).catch(processingError => {
        console.error('Error in background document processing:', processingError);
      });
      
      console.log(`Started background processing for document: ${document.id}`);
    } catch (processingSetupError) {
      console.error('Error setting up document processing:', processingSetupError);
      // We don't return an error here since the document was created in the DB
      // The processing status will be updated to 'failed' by the processor itself
    }

    return NextResponse.json({
      ...document,
      message: 'Document created and processing started',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge document' },
      { status: 500 }
    );
  }
}