import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';

/**
 * Extension knowledge synchronization endpoint for text notes
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { userId, notes, clientTimestamp } = await request.json();
    
    // Verify the user ID matches the authenticated user
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notes to sync' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${notes.length} notes from extension`);
    
    const syncedIds: number[] = [];
    const errors: { id: number, error: string }[] = [];
    
    // Process each note
    for (const note of notes) {
      try {
        // Create a knowledge document for the note
        const document = await createKnowledgeDocument({
          userId: session.user.id,
          title: note.content.substring(0, 30) + (note.content.length > 30 ? '...' : ''),
          description: 'Note from Chrome extension',
          sourceType: 'text',
          sourceUrl: '',
          fileSize: '',
          fileType: 'text/plain',
        });
        
        // Process the document
        try {
          processDocumentLocal({
            document,
            content: note.content,
            userId: session.user.id
          }).catch(processingError => {
            console.error('Error in background document processing:', processingError);
          });
        } catch (processingError) {
          console.error('Error setting up document processing:', processingError);
          // Continue processing other notes
        }
        
        // Mark this note as synced
        syncedIds.push(note.id);
      } catch (noteError) {
        console.error(`Error processing note ${note.id}:`, noteError);
        errors.push({ id: note.id, error: noteError.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedIds,
      errors,
      syncTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in extension notes sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Synchronization failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
