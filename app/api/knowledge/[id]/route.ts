import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getKnowledgeDocumentById, 
  updateKnowledgeDocument, 
  deleteKnowledgeDocument,
  getChunksByDocumentId
} from '@/lib/db/queries';

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

    const document = await getKnowledgeDocumentById({
      id: params.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get chunks for this document
    const chunks = await getChunksByDocumentId({
      documentId: params.id,
    });

    return NextResponse.json({
      document,
      chunks,
    });
  } catch (error) {
    console.error('Error fetching knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge document' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const document = await getKnowledgeDocumentById({
      id: params.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description } = body;

    const updatedDocument = await updateKnowledgeDocument({
      id: params.id,
      title,
      description,
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const document = await getKnowledgeDocumentById({
      id: params.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await deleteKnowledgeDocument({
      id: params.id,
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge document' },
      { status: 500 }
    );
  }
} 