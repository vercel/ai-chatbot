import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentById } from '@/lib/db/queries';
import { getTranscript } from '@/lib/knowledge/localFiles/audioFileHandler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const documentId = id;
    
    // Get the document to check status
    const document = await getKnowledgeDocumentById({ id: documentId });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Check if document belongs to the authenticated user
    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get transcript if it exists
    const transcript = getTranscript(session.user.id, documentId);
    
    // Return progress based on document status
    switch (document.status) {
      case 'processing':
        return NextResponse.json({
          status: 'processing',
          progress: 50, // In a real app, we would track actual progress
          message: 'Transcription in progress...',
          documentId: document.id,
          partialTranscript: transcript ? transcript.text.substring(0, 200) + '...' : null
        });
        
      case 'completed':
        return NextResponse.json({
          status: 'completed',
          progress: 100,
          message: 'Transcription completed',
          documentId: document.id,
          transcript: transcript
        });
        
      case 'failed':
        return NextResponse.json({
          status: 'failed',
          progress: 0,
          error: document.processingError || 'Transcription failed',
          documentId: document.id
        });
        
      default:
        return NextResponse.json({
          status: 'unknown',
          progress: 0,
          message: 'Unknown status',
          documentId: document.id
        });
    }
  } catch (error) {
    console.error('Error checking transcription progress:', error);
    return NextResponse.json(
      { error: 'Failed to check transcription progress' },
      { status: 500 }
    );
  }
}