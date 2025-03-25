import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { saveAudioFile } from '@/lib/knowledge/localFiles/audioFileHandler';
import { processAudioFile } from '@/lib/knowledge/localFiles/audioProcessor';

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
 * API endpoint for adding uploaded audio files to the knowledge base
 * 
 * Expected FormData fields:
 * - title: string (required) - Document title
 * - description: string (optional) - Document description
 * - file: File (required) - The audio file to process
 */
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/knowledge-audio received');
  
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
          message: 'You must be signed in to add audio documents',
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
    const audioFile = formData.get('file') as File;
    
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
    
    if (!audioFile) {
      console.log(`[API] ${requestId}: Missing required field: file`);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Audio file is required',
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
    console.log(`[API] ${requestId}: Creating audio document in database...`);
    let document;
    
    try {
      document = await createKnowledgeDocument({
        userId,
        title,
        description,
        sourceType: 'audio',
        sourceUrl: '',
        fileSize: (audioFile.size / 1024).toFixed(2) + ' KB',
        fileType: audioFile.type || 'audio/unknown',
      });
      
      console.log(`[API] ${requestId}: Audio document created with ID: ${document.id}`);
    } catch (dbError) {
      console.error(`[API] ${requestId}: Database error creating audio document:`, dbError);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Failed to create audio document in database',
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
    
    // 5. Save the audio file
    console.log(`[API] ${requestId}: Saving audio file...`);
    let filePath;
    
    try {
      filePath = await saveAudioFile(audioFile, userId, document.id);
      console.log(`[API] ${requestId}: Saved audio file to ${filePath}`);
    } catch (fileError) {
      console.error(`[API] ${requestId}: Error saving audio file:`, fileError);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Failed to save audio file',
          details: fileError instanceof Error ? fileError.message : 'Unknown file error',
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
    
    // 6. Process the audio file asynchronously
    console.log(`[API] ${requestId}: Starting audio processing in background...`);
    
    // Don't await the processing - do it in the background
    processAudioFile({
      document,
      audioFile,
      audioFilePath: filePath,
      userId
    }).catch(processingError => {
      console.error(`[API] ${requestId}: Background audio processing error:`, processingError);
      // The error will be handled within the processor and the document status will be updated
    });
    
    // 7. Return success response
    console.log(`[API] ${requestId}: Request successful, returning response`);
    
    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          createdAt: document.createdAt,
          status: document.status
        },
        message: 'Audio file uploaded and processing started',
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