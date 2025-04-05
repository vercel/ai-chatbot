import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentsByUserId } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id as string;
    const documents = await getKnowledgeDocumentsByUserId({ userId });
    
    // Return maximum of 10 most recent documents for better performance
    const sortedDocuments = documents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    // Format the response to only include necessary fields
    const formattedDocuments = sortedDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      sourceType: doc.sourceType,
      status: doc.status
    }));

    console.log(`Fetched ${formattedDocuments.length} knowledge documents for user ${userId}`);
    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge documents' },
      { status: 500 }
    );
  }
}