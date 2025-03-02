import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { knowledgeDocument, knowledgeChunk } from '@/lib/db/schema';

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { query, embedding, limit = 5 } = await req.json();

    if (!query || !embedding) {
      return NextResponse.json(
        { error: 'Query and embedding are required' },
        { status: 400 }
      );
    }

    // Since we're temporarily storing embeddings as text, we'll do a basic
    // search without vector operations
    // Fetch the most recent chunks from the user's documents
    const results = await db
      .select({
        id: knowledgeChunk.id,
        content: knowledgeChunk.content,
        metadata: knowledgeChunk.metadata,
        documentId: knowledgeDocument.id,
        documentTitle: knowledgeDocument.title,
        documentUrl: knowledgeDocument.sourceUrl,
      })
      .from(knowledgeChunk)
      .innerJoin(
        knowledgeDocument,
        eq(knowledgeChunk.documentId, knowledgeDocument.id)
      )
      .where(eq(knowledgeDocument.userId, session.user.id as string))
      .limit(limit);

    // Format the results
    const formattedResults = results.map((result) => ({
      id: result.id,
      content: result.content,
      title: result.documentTitle,
      documentId: result.documentId,
      score: 0.95, // Dummy score since we can't do vector similarity right now
      url: result.documentUrl || undefined,
      metadata: result.metadata ? result.metadata : {},
    }));

    console.log(`Found ${formattedResults.length} knowledge references for query: "${query}"`);
    
    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
} 