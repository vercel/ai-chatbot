import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { fetchWebContent } from '@/lib/knowledge/urlProcessor';

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
    const sourceUrl = formData.get('sourceUrl') as string;
    const notes = formData.get('notes') as string;
    
    if (!title || !sourceUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(sourceUrl);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create the document in the database
    const document = await createKnowledgeDocument({
      userId: session.user.id,
      title,
      description: description || (notes ? `Notes: ${notes}` : ''),
      sourceType: 'url',
      sourceUrl,
      fileSize: '',
      fileType: '',
    });
    
    console.log(`Created URL knowledge document in database: ${document.id}`);

    // Process the URL content asynchronously
    try {
      // Start processing in the background
      fetchWebContent({
        documentId: document.id,
        url: sourceUrl,
        userId: session.user.id
      }).catch(processingError => {
        console.error('Error in background URL processing:', processingError);
      });
      
      console.log(`Started background processing for URL document: ${document.id}`);
    } catch (processingSetupError) {
      console.error('Error setting up URL processing:', processingSetupError);
      // The processing status will be updated to 'failed' by the processor itself
    }

    return NextResponse.json({
      ...document,
      message: 'URL document created and processing started',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating URL knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to create URL knowledge document' },
      { status: 500 }
    );
  }
}