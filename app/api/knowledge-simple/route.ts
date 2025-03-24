import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';

export const dynamic = 'force-dynamic';

// Simple GET endpoint for testing
export async function GET(req: NextRequest) {
  console.log('[API] GET /api/knowledge-simple received');
  
  try {
    // Try without authentication first for testing
    return NextResponse.json({ 
      message: 'Knowledge simple API is working',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('[API] Error in knowledge-simple GET:', error);
    return NextResponse.json({ 
      error: 'API error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Simplified POST endpoint for text submissions
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/knowledge-simple received');
  console.log('[API] Request URL:', req.url);
  
  try {
    // Parse form data
    const formData = await req.formData();
    const keys = Array.from(formData.keys());
    console.log('[API] Received form data keys:', keys);
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const sourceType = formData.get('sourceType') as string || 'text';
    const content = formData.get('content') as string || '';
    const sourceUrl = formData.get('sourceUrl') as string || '';
    const notes = formData.get('notes') as string || '';
    
    console.log('[API] Processing document with title:', title);
    
    try {
      // Get auth session (try/catch separately to isolate auth issues)
      const session = await auth();
      
      if (!session?.user) {
        console.log('[API] Authentication failed - no user session');
        return NextResponse.json({ 
          error: 'Authentication failed',
          message: 'Please sign in to add documents' 
        }, { status: 401 });
      }
      
      console.log('[API] User authenticated:', session.user.id);
      
      // Create the document in the database
      const document = await createKnowledgeDocument({
        userId: session.user.id,
        title,
        description: sourceType === 'url' && notes ? `${description}\nNotes: ${notes}` : description,
        sourceType: sourceType,
        sourceUrl: sourceUrl,
        fileSize: '',
        fileType: '',
      });
      
      console.log(`[API] Created text document in database with ID: ${document.id}`);
      
      // Process the document asynchronously based on source type
      try {
        if (sourceType === 'url' && sourceUrl) {
          // For URL documents
          console.log(`[API] Processing URL content from: ${sourceUrl}`);
          // Import and use URL processor
          const { fetchWebContent } = await import('@/lib/knowledge/urlProcessor');
          fetchWebContent({
            documentId: document.id,
            url: sourceUrl,
            userId: session.user.id
          }).catch(error => {
            console.error('[API] Background URL processing error:', error);
          });
          
          console.log(`[API] Started background URL processing for document: ${document.id}`);
        } else {
          // For text documents
          console.log(`[API] Processing text content of length: ${content?.length || 0}`);
          processDocumentLocal({
            document,
            content,
            userId: session.user.id
          }).catch(error => {
            console.error('[API] Background processing error:', error);
          });
          
          console.log(`[API] Started background processing for document: ${document.id}`);
        }
      } catch (processingError) {
        console.error('[API] Error setting up document processing:', processingError);
        // Continue since the document is already created
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        documentId: document.id,
        title: document.title,
        message: 'Document created and processing started',
      }, { status: 201 });
      
    } catch (sessionError) {
      console.error('[API] Error getting session:', sessionError);
      return NextResponse.json({ 
        error: 'Session error',
        details: sessionError instanceof Error ? sessionError.message : 'Unknown session error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[API] Error processing knowledge document:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}