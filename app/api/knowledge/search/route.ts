import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { eq, sql, ilike } from 'drizzle-orm';
import { OpenAI } from 'openai';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { knowledgeDocument, knowledgeChunk } from '@/lib/db/schema';

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Initialize OpenAI client
const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    console.error('Unauthorized access to knowledge search API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { query, embedding, limit = 5 } = await req.json();

    console.log(`Knowledge search API: Query="${query?.substring(0, 50)}...", User=${session.user.id}`);

    if (!query) {
      console.error('Missing query parameter in knowledge search');
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Generate embeddings if not provided
    let queryEmbedding = embedding;
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      console.log('Generating embedding for query via OpenAI API');
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: query,
        });
        
        queryEmbedding = embeddingResponse.data[0].embedding;
        console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);
      } catch (embeddingError: any) {
        console.error('Error generating embedding:', embeddingError);
        console.error(embeddingError.stack || 'No stack trace available');
        
        // Fallback to simplified search if embedding generation fails
        console.log('Falling back to simplified search without embeddings');
      }
    }

    // Check if we have a valid embedding now
    if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
      console.log('Using vector similarity search with embeddings');
      // Transform embedding to CUBE format for pgvector
      const cubeQuery = `{${queryEmbedding.join(',')}}`;
      
      try {
        // Query using cosine similarity with the vector index
        const results = await db.execute(sql`
          SELECT 
            kc.id,
            kc.document_id AS "documentId", 
            kd.title,
            kc.content,
            kd.source_url AS url,
            1 - (kc.embedding <=> ${cubeQuery}::vector) AS score
          FROM knowledge_chunk kc
          JOIN knowledge_document kd ON kc.document_id = kd.id
          WHERE kd.user_id = ${session.user.id}
          ORDER BY score DESC
          LIMIT ${limit}
        `);
        
        console.log(`Found ${results.length} documents with vector similarity search`);
        
        // Format results in a consistent way
        const formattedResults = results.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.documentid,
          title: chunk.title || 'Untitled Document',
          content: chunk.content,
          url: chunk.url || '',
          score: parseFloat(chunk.score) || 0,
        }));
        
        return NextResponse.json(formattedResults);
      } catch (dbError: any) {
        console.error('Database error in vector similarity search:', dbError);
        console.error(dbError.stack || 'No stack trace available');
        
        // Fallback to simplified search if vector search fails
        console.log('Falling back to simplified search due to vector search error');
      }
    }
    
    // Fallback to simplified search without embeddings
    console.log('Using simplified search with basic text filtering');
    
    try {
      // Use text matching with ILIKE
      const textMatchResults = await db.execute(sql`
        SELECT 
          kc.id,
          kc.document_id AS "documentId", 
          kd.title,
          kc.content,
          kd.source_url AS url
        FROM knowledge_chunk kc
        JOIN knowledge_document kd ON kc.document_id = kd.id
        WHERE kd.user_id = ${session.user.id}
        AND kc.content ILIKE ${`%${query}%`}
        ORDER BY kd.created_at DESC
        LIMIT ${limit}
      `);
      
      if (textMatchResults.length > 0) {
        const formattedResults = textMatchResults.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.documentid,
          title: chunk.title || 'Untitled Document',
          content: chunk.content,
          url: chunk.url || '',
          score: 0.5, // Arbitrary score for text matching
        }));
        
        console.log(`Found ${formattedResults.length} documents with text matching`);
        return NextResponse.json(formattedResults);
      }
      
      // If no results with ILIKE, fall back to most recent documents
      console.log('No matching documents found, returning most recent documents');
      
      const recentResults = await db.execute(sql`
        SELECT 
          kc.id,
          kc.document_id AS "documentId", 
          kd.title,
          kc.content,
          kd.source_url AS url
        FROM knowledge_chunk kc
        JOIN knowledge_document kd ON kc.document_id = kd.id
        WHERE kd.user_id = ${session.user.id}
        ORDER BY kd.created_at DESC
        LIMIT ${limit}
      `);
      
      const recentFormattedResults = recentResults.map((chunk: any) => ({
        id: chunk.id,
        documentId: chunk.documentid,
        title: chunk.title || 'Untitled Document',
        content: chunk.content,
        url: chunk.url || '',
        score: 0.1, // Lower score for recent but not matching
      }));
      
      console.log(`Found ${recentFormattedResults.length} most recent documents`);
      return NextResponse.json(recentFormattedResults);
    } catch (dbError: any) {
      console.error('Database error in simplified search:', dbError);
      console.error(dbError.stack || 'No stack trace available');
      
      return NextResponse.json({ 
        error: 'Database error in knowledge search', 
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in knowledge search API:', error);
    console.error(error.stack || 'No stack trace available');
    
    return NextResponse.json({ 
      error: 'An error occurred in knowledge search', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
} 