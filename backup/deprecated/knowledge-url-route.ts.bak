import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { fetchWebContent } from '@/lib/knowledge/urlProcessor';

// Ensure this endpoint is always fresh and not cached
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// CORS headers
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * API endpoint for adding URL documents to the knowledge base
 * 
 * Expected FormData fields:
 * - title: string (required) - Document title
 * - description: string (optional) - Document description
 * - sourceUrl: string (required) - The URL to process
 * - notes: string (optional) - Additional notes about the URL
 */
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/knowledge-url received');
  
  // Add detailed request logging for debugging
  const requestId = crypto.randomUUID();
  console.log(`[API] Request ID: ${requestId}`);
  console.log(`[API] Request URL: ${req.url}`);
  console.log(`[API] Request method: ${req.method}`);
  
  try {
    // 1. Authentication check
    console.log(`[API] ${requestId}: Authenticating user...`);
    const session = await auth();
    
    if (!session?.user) {
      console.log(`[API] ${requestId}: Authentication failed - no user session`);
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'You must be signed in to add documents',
          requestId 
        },
        { 
          status: 401,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    const userId = session.user.id;
    console.log(`[API] ${requestId}: User authenticated, ID: ${userId}`);
    
    // 2. Parse and validate form data
    console.log(`[API] ${requestId}: Parsing form data...`);
    
    let formData: FormData;
    try {
      formData = await req.formData();
      console.log(`[API] ${requestId}: Form data received with keys: ${Array.from(formData.keys()).join(', ')}`);
    } catch (formDataError) {
      console.error(`[API] ${requestId}: Failed to parse form data:`, formDataError);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Failed to parse form data',
          requestId 
        },
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    // 3. Extract and validate required fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const sourceUrl = formData.get('sourceUrl') as string;
    const notes = formData.get('notes') as string || '';
    
    console.log(`[API] ${requestId}: Received URL document titled "${title}" with URL: ${sourceUrl}`);
    
    if (!title) {
      console.log(`[API] ${requestId}: Missing required field: title`);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Title is required',
          requestId 
        },
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    if (!sourceUrl) {
      console.log(`[API] ${requestId}: Missing required field: sourceUrl`);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'URL is required',
          requestId 
        },
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    // Validate URL format
    try {
      new URL(sourceUrl);
    } catch (urlError) {
      console.log(`[API] ${requestId}: Invalid URL format: ${sourceUrl}`);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Invalid URL format. Please provide a valid URL starting with http:// or https://',
          requestId 
        },
        { 
          status: 400,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    // 4. Create the knowledge document in the database
    console.log(`[API] ${requestId}: Creating URL document in database...`);
    let document;
    
    // Combine description and notes if both are present
    const combinedDescription = notes 
      ? `${description || ''}\n\nNotes: ${notes}`.trim() 
      : description;
    
    try {
      document = await createKnowledgeDocument({
        userId,
        title,
        description: combinedDescription,
        sourceType: 'url',
        sourceUrl: sourceUrl,
        fileSize: '',
        fileType: 'text/html',
      });
      
      console.log(`[API] ${requestId}: URL document created with ID: ${document.id}`);
    } catch (dbError) {
      console.error(`[API] ${requestId}: Database error creating URL document:`, dbError);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Failed to create URL document in database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          requestId 
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    // 5. Process the URL document asynchronously
    console.log(`[API] ${requestId}: Starting URL processing in background...`);
    
    // Don't await the processing - do it in the background
    fetchWebContent({
      documentId: document.id,
      url: sourceUrl,
      userId
    }).catch(processingError => {
      console.error(`[API] ${requestId}: Background URL processing error:`, processingError);
      // The error will be handled within the processor and the document status will be updated
    });
    
    // 6. Return success response
    console.log(`[API] ${requestId}: Request successful, returning response`);
    
    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          createdAt: document.createdAt,
          status: document.status,
          sourceUrl
        },
        message: 'URL document added successfully and is being processed',
        requestId
      },
      { 
        status: 201,
        headers: {
          'X-Request-ID': requestId
        }
      }
    );
    
  } catch (error) {
    // Global error handler for unexpected errors
    console.error(`[API] ${requestId}: Unhandled error:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId
        }
      }
    );
  }
}