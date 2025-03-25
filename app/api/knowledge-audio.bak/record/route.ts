import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { saveRecordedAudio } from '@/lib/knowledge/localFiles/audioFileHandler';
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
 * API endpoint for adding recorded audio to the knowledge base
 * 
 * Expected FormData fields:
 * - title: string (required) - Document title
 * - description: string (optional) - Document description
 * - audioBlob: Blob (required) - The recorded audio blob to process
 */
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/knowledge-audio/record received');
  
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
          message: 'You must be signed in to add audio recordings',
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
    const audioBlob = formData.get('audioBlob') as Blob;
    
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
    
    if (!audioBlob) {
      console.log(`[API] ${requestId}: Missing required field: audioBlob`);
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Audio recording is required',
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
    console.log(`[API] ${requestId}: Creating recorded audio document in database...`);
    let document;
    
    try {
      document = await createKnowledgeDocument({
        userId,
        title,
        description,
        sourceType: 'audio',
        sourceUrl: '',
        fileSize: (audioBlob.size / 1024).toFixed(2) + ' KB',
        fileType: audioBlob.type || 'audio/webm',
      });
      
      console.log(`[API] ${requestId}: Recorded audio document created with ID: ${document.id}`);
    } catch (dbError) {
      console.error(`[API] ${requestId}: Database error creating recorded audio document:`, dbError);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Failed to create recorded audio document in database',
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
    
    // 5. Save the recorded audio
    console.log(`[API] ${requestId}: Saving recorded audio...`);
    let filePath;
    
    try {
      filePath = await saveRecordedAudio(audioBlob, userId, document.id);
      console.log(`[API] ${requestId}: Saved recorded audio to ${filePath}`);
    } catch (fileError) {
      console.error(`[API] ${requestId}: Error saving recorded audio:`, fileError);
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Failed to save recorded audio',
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
    console.log(`[API] ${requestId}: Starting recorded audio processing in background...`);
    
    // Create a File object from the Blob for processing
    const file = new File([audioBlob], `recording-${document.id}.webm`, { 
      type: 'audio/webm' 
    });
    
    // Don't await the processing - do it in the background
    processAudioFile({
      document,
      audioFile: file,
      audioFilePath: filePath,
      userId
    }).catch(processingError => {
      console.error(`[API] ${requestId}: Background recorded audio processing error:`, processingError);
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
        message: 'Recorded audio uploaded and processing started',
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