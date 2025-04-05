import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentsByUserId } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch knowledge documents for the current user
    const documents = await getKnowledgeDocumentsByUserId({ userId: session.user.id as string });
    
    // Format the response to include only the necessary fields
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      sourceType: doc.sourceType,
      status: doc.status,
    }));
    
    // Filter out documents that are not completed (still processing or failed)
    // and limit to 10 most recent completed documents
    const completedDocuments = formattedDocuments
      .filter(doc => doc.status === 'completed')
      .slice(0, 10);
    
    return NextResponse.json(completedDocuments);
  } catch (error) {
    console.error('Error retrieving knowledge documents:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge documents' },
      { status: 500 }
    );
  }
}