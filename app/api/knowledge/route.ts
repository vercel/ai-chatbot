import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument, getKnowledgeDocumentsByUserId } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';
import { handleFileUpload } from '@/lib/knowledge/localFiles/serverFileHandler';
import { savePdfFile } from '@/lib/knowledge/localFiles/pdfFileHandler';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';

// Add these CORS headers to prevent preflight issues
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    console.log('[API] GET /api/knowledge received');
    const session = await auth();
    
    if (!session?.user) {
      console.log('[API] GET /api/knowledge unauthorized access attempt');
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
  console.log('[API] POST /api/knowledge route handler invoked');
  console.log('[API] Request URL:', req.url);
  console.log('[API] Request method:', req.method);
  console.log('[API] Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log('[API] POST /api/knowledge unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User session not found' },
        { status: 401 }
      );
    }
    
    console.log('[API] POST /api/knowledge authenticated as user:', session.user.id);

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

    // Process different source types
    if (sourceType === 'text') {
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
      
      console.log(`Created text document in database: ${document.id}`);
      
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
        
        console.log(`Started background processing for text document: ${document.id}`);
      } catch (processingSetupError) {
        console.error('Error setting up document processing:', processingSetupError);
        // We don't return an error here since the document was created in the DB
        // The processing status will be updated to 'failed' by the processor itself
      }
      
      // Create a successful response with detailed headers for debugging
    return new NextResponse(JSON.stringify({
      ...document,
      message: 'Document created and processing started',
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Status': 'success',
      }
    });
      
    } else if (sourceType === 'pdf') {
      // Handle PDF upload
      const pdfFile = formData.get('file') as File;
      
      if (!pdfFile) {
        return NextResponse.json(
          { error: 'PDF file is required' },
          { status: 400 }
        );
      }

      // Verify file type
      if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'File must be a PDF' },
          { status: 400 }
        );
      }

      // Create the document in the database
      const document = await createKnowledgeDocument({
        userId: session.user.id,
        title,
        description,
        sourceType: 'pdf',
        sourceUrl: '',
        fileSize: (pdfFile.size / 1024).toFixed(2) + ' KB',
        fileType: pdfFile.type || 'application/pdf',
      });
      
      console.log(`Created PDF document in database: ${document.id}`);
      
      // Save the PDF file
      const filePath = await savePdfFile(pdfFile, session.user.id, document.id);
      console.log(`Saved PDF file to ${filePath}`);

      // Start processing in the background
      processDocumentLocal({
        document,
        userId: session.user.id,
        filePath: filePath,
      }).catch(error => {
        console.error('Error processing PDF file:', error);
      });

      return NextResponse.json({
        ...document,
        message: 'PDF file uploaded and processing started',
      }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: `Unsupported document type: ${sourceType}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('session')) {
        return NextResponse.json(
          { error: 'Authentication error', details: error.message },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create knowledge document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}