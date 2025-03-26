import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentsByUserId } from '@/lib/db/queries';

/**
 * Get updated knowledge for the extension
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the last sync timestamp from query parameters
    const searchParams = request.nextUrl.searchParams;
    const lastSync = searchParams.get('lastSync');
    
    // Get all knowledge documents for the user
    const documents = await getKnowledgeDocumentsByUserId({
      userId: session.user.id,
    });
    
    // Filter documents based on last sync time
    let filteredDocuments = documents;
    if (lastSync) {
      const lastSyncDate = new Date(lastSync);
      filteredDocuments = documents.filter(doc => {
        const updatedAt = new Date(doc.updatedAt || doc.createdAt);
        return updatedAt > lastSyncDate;
      });
    }
    
    // Format the response
    const knowledge = filteredDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      sourceType: doc.sourceType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      // Omit content - it would be too large and not needed in the extension
    }));
    
    return NextResponse.json({
      success: true,
      knowledge,
      total: knowledge.length,
      syncTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching knowledge updates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch knowledge updates',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
