import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document, embeddings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;

  try {
    // First check if document belongs to the current user
    const [doc] = await db
      .select({ id: document.id })
      .from(document)
      .where(and(eq(document.id, id), eq(document.userId, session.user.id)));

    if (!doc) {
      return Response.json(
        { error: 'Document not found or not authorized' },
        { status: 404 },
      );
    }

    // Delete associated embeddings first
    await db.delete(embeddings).where(eq(embeddings.resourceId, id));

    // Then delete the document
    await db.delete(document).where(eq(document.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return Response.json(
      { error: 'Failed to delete document' },
      { status: 500 },
    );
  }
}
