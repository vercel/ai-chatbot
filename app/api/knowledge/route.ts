import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument, getKnowledgeDocumentsByUserId } from '@/lib/db/queries';
import { processDocument } from '@/lib/knowledge/processor';

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
    const sourceType = formData.get('sourceType') as 'pdf' | 'text' | 'url' | 'audio' | 'video' | 'youtube';
    
    if (!title || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let sourceUrl = '';
    let fileSize = '';
    let fileType = '';
    let content = '';

    // Handle different source types
    if (sourceType === 'text') {
      content = formData.get('content') as string;
      if (!content) {
        return NextResponse.json(
          { error: 'Missing content for text document' },
          { status: 400 }
        );
      }
    } else if (sourceType === 'url' || sourceType === 'youtube') {
      sourceUrl = formData.get('sourceUrl') as string;
      if (!sourceUrl) {
        return NextResponse.json(
          { error: 'Missing URL' },
          { status: 400 }
        );
      }
    } else {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json(
          { error: 'Missing file' },
          { status: 400 }
        );
      }
      fileSize = file.size.toString();
      fileType = file.type;
      
      // Here you would handle file upload to storage
      // For now, we'll just create the document record
    }

    // Create the document in the database
    const document = await createKnowledgeDocument({
      userId: session.user.id,
      title,
      description,
      sourceType,
      sourceUrl,
      fileSize,
      fileType,
    });

    // Process the document asynchronously
    // This would typically be done in a background job
    // For simplicity, we'll just call it here
    processDocument({
      document,
      content,
      // file would be passed here in a real implementation
    }).catch(error => {
      console.error('Error processing document:', error);
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge document' },
      { status: 500 }
    );
  }
} 