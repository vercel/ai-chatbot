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

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const references = await getReferencesByMessageId({ messageId });
    console.log(`Retrieved ${references.length} knowledge references for message ID: ${messageId}`);

    // Format the references for the client
    const formattedReferences = references.map((ref) => ({
      id: ref.reference.id,
      title: ref.document.title,
      content: ref.chunk.content,
      score: 1, // Default score since we don't have a score in the database
      url: ref.document.sourceUrl || undefined,
    }));

    return NextResponse.json(formattedReferences);
  } catch (error) {
    console.error('Error retrieving knowledge references:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge references' },
      { status: 500 }
    );
  }
} 