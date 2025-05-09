import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { embeddings } from '../db/schema';

// Create our own database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const embeddingModel = openai.embedding('text-embedding-3-small');

/**
 * Searches for similar document chunks based on a query
 * @param query - The search query
 * @param limit - Maximum number of results to return
 * @returns Array of document chunks with their content and similarity score
 */
export async function searchSimilarDocuments(query: string, limit = 5) {
  try {
    // Generate embedding for the query
    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // Convert embedding to Postgres vector format
    const embeddingStr = JSON.stringify(embedding);

    // Search for similar documents using cosine similarity
    const results = await db.execute(sql`
      SELECT 
        e.id,
        e.content,
        e."resourceId",
        (e.embedding <=> ${embeddingStr}::vector) as similarity
      FROM ${embeddings} e
      ORDER BY similarity ASC
      LIMIT ${limit}
    `);

    return results.map((result: any) => ({
      id: result.id,
      content: result.content,
      resourceId: result.resourceId,
      similarity: result.similarity,
    }));
  } catch (error) {
    console.error('Error searching for similar documents:', error);
    throw error;
  }
}
