import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch documents for the current user
    const documents = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        createdAt: document.createdAt,
      })
      .from(document)
      .where(eq(document.userId, session.user.id))
      .orderBy(document.createdAt);

    return Response.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return Response.json(
      { error: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}
