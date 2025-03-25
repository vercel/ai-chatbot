import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getReferencesByMessageId } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const retryAttempt = searchParams.get('retry') || '0';

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const references = await getReferencesByMessageId({ messageId });
    console.log(`Retrieved ${references.length} knowledge references for message ID: ${messageId} (retry ${retryAttempt})`);

    // If no references are found, check if we can create some
    if (references.length === 0) {
      console.log(`No references found for message ID: ${messageId}, make sure createKnowledgeReference is being called`);
    }

    // Format the references for the client
    const formattedReferences = references.map((ref) => ({
      id: ref.reference.id,
      title: ref.document.title || `Source ${references.indexOf(ref) + 1}`,
      content: ref.chunk.content,
      score: 1, // Default score since we don't have a score in the database
      url: ref.document.sourceUrl || undefined,
    }));

    // Set cache control headers to allow revalidation
    return new NextResponse(JSON.stringify(formattedReferences), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error retrieving knowledge references:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge references', details: error.message },
      { status: 500 }
    );
  }
} 