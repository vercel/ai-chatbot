import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Add OPTIONS handler for CORS
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

// Simple GET handler
export async function GET(req: NextRequest) {
  console.log('[API] GET /api/duplicate-knowledge route handler invoked');
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log('[API] GET /api/duplicate-knowledge - unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Duplicate knowledge endpoint is working', 
      userId: session.user.id 
    });
  } catch (error) {
    console.error('[API] Error in duplicate knowledge GET:', error);
    return NextResponse.json(
      { error: 'API error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Simplified POST handler
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/duplicate-knowledge route handler invoked');
  console.log('[API] Request URL:', req.url);
  console.log('[API] Request method:', req.method);
  console.log('[API] Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log('[API] POST /api/duplicate-knowledge - unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User session not found' },
        { status: 401 }
      );
    }
    
    console.log('[API] POST /api/duplicate-knowledge - authenticated as user:', session.user.id);

    try {
      const formData = await req.formData();
      const keys = Array.from(formData.keys());
      console.log('[API] Received form data keys:', keys);
      
      const title = formData.get('title') as string;
      const description = formData.get('description') as string || '';
      const sourceType = formData.get('sourceType') as string || 'text';
      const content = formData.get('content') as string || '';
      
      console.log('[API] Parsed form data fields:', { title, description: description.substring(0, 20) + '...', sourceType });
      
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
      
      console.log(`[API] Created text document in database: ${document.id}`);
      
      // Process the document asynchronously
      try {
        processDocumentLocal({
          document,
          content,
          userId: session.user.id
        }).catch(processingError => {
          console.error('Error in background document processing:', processingError);
        });
        
        console.log(`[API] Started background processing for text document: ${document.id}`);
      } catch (processingSetupError) {
        console.error('Error setting up document processing:', processingSetupError);
      }
      
      // Create a successful response with detailed headers for debugging
      return new Response(JSON.stringify({
        id: document.id,
        title: document.title,
        message: 'Document created and processing started',
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Status': 'success',
        }
      });
    } catch (parseError) {
      console.error('[API] Error parsing form data:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse form data', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] Error in duplicate knowledge POST:', error);
    return NextResponse.json(
      { error: 'API error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}