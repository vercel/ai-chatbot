import { getEmbedding } from './fileHandler';
import OpenAI from 'openai';
import { knowledgeChunk, knowledgeDocument } from '../../db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { getFallbackResults } from './fallbackResults';
import { basicKnowledgeSearch } from '../../db/schemaAdapter';

// Enable debug mode for detailed logging
const DEBUG_MODE = true;

// Initialize OpenAI client
const openai = new OpenAI();

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Search for relevant document chunks based on a query
 * First tries to use database, then falls back to local similarity if needed
 */
export async function searchKnowledgeLocal(
  query: string,
  userId: string,
  limit: number = 5
): Promise<any[]> {
  console.log(`[LOCAL SEARCH] Searching knowledge for query: "${query.substring(0, 50)}..."`);
  if (DEBUG_MODE) {
    console.log(`[LOCAL SEARCH] Search details:\n- User ID: ${userId}\n- Limit: ${limit}\n- Full query: ${query}`);
  }
  
  try {
    // First, try to use the database with vector search
    console.log('[LOCAL SEARCH] Attempting to use database vector search');
    
    // Generate embedding for the query
    let queryEmbedding: number[] = [];
    try {
      // Check if we already have an embedding for this query
      queryEmbedding = getEmbedding(query) || [];
      
      // If not, generate a new one
      if (!queryEmbedding.length) {
        console.log('[LOCAL SEARCH] Generating new embedding for query');
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: query,
        });
        queryEmbedding = response.data[0].embedding;
        if (DEBUG_MODE) {
          console.log(`[LOCAL SEARCH] Generated embedding with ${queryEmbedding.length} dimensions`);
        }
      } else {
        console.log('[LOCAL SEARCH] Using cached embedding for query');
      }
    } catch (embError) {
      console.error('[LOCAL SEARCH] Error generating embedding:', embError);
    }
    
    // Log database connection info in debug mode
    if (DEBUG_MODE) {
      console.log(`[LOCAL SEARCH] Database connection string: ${process.env.POSTGRES_URL?.replace(/:[^:@]*@/, ':***@')}`);
      try {
        const testResult = await db.execute(sql`SELECT current_database() as db_name`);
        console.log(`[LOCAL SEARCH] Connected to database: ${testResult[0]?.db_name || 'unknown'}`);
      } catch (dbConnError) {
        console.error('[LOCAL SEARCH] Database connection test failed:', dbConnError);
      }
      
      // List all tables to debug database schema issues
      try {
        const tables = await db.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log(`[LOCAL SEARCH] Available tables in database: ${tables.map((t: any) => t.table_name).join(', ')}`);
      } catch (tablesError) {
        console.error('[LOCAL SEARCH] Error listing database tables:', tablesError);
      }
    }
    
    if (queryEmbedding.length > 0) {
      try {
        // First, try text search instead of vector search
        console.log('[LOCAL SEARCH] Using text-based search');
        
        const textResults = await db.execute(sql`
          SELECT 
            kc.id,
            kc.document_id AS "documentId", 
            kd.title,
            kc.content,
            kd.source_url AS url
          FROM knowledge_chunk kc
          JOIN knowledge_document kd ON kc.document_id = kd.id
          WHERE kd.user_id = ${userId}
          AND kc.content ILIKE ${`%${query}%`}
          LIMIT ${limit}
        `);
        
        if (textResults.length > 0) {
          console.log(`[LOCAL SEARCH] Found ${textResults.length} results using text search`);
          
          // Format results
          return textResults.map((chunk: any) => ({
            id: chunk.id,
            documentId: chunk.documentid,
            title: chunk.title || 'Untitled Document',
            content: chunk.content,
            url: chunk.url || '',
            score: 0.5, // Default score for text matches
          }));
        }
      } catch (dbError) {
        console.error('[LOCAL SEARCH] Database vector search error:', dbError);
        // Continue to fallback methods
      }
    }
    
    // Try using basic knowledge search with schema adapter
    try {
      console.log('[LOCAL SEARCH] Trying direct schema adapter search');
      const directResults = await basicKnowledgeSearch(query, userId, limit);
      
      if (directResults.length > 0) {
        console.log(`[LOCAL SEARCH] Found ${directResults.length} results using direct search`);
        return directResults;
      }
    } catch (directError) {
      console.error('[LOCAL SEARCH] Direct search error:', directError);
    }
    
    // Fallback: Basic text search in the database
    console.log('[LOCAL SEARCH] Falling back to basic text search');
    try {
      const textResults = await db.execute(sql`
        SELECT 
          kc.id,
          kc.document_id AS "documentId", 
          kd.title,
          kc.content,
          kd.source_url AS url
        FROM knowledge_chunk kc
        JOIN knowledge_document kd ON kc.document_id = kd.id
        WHERE kd.user_id = ${userId}
        AND kc.content ILIKE ${`%${query}%`}
        LIMIT ${limit}
      `);
      
      if (textResults.length > 0) {
        console.log(`[LOCAL SEARCH] Found ${textResults.length} results using text search`);
        
        // Format results
        return textResults.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.documentid,
          title: chunk.title || 'Untitled Document',
          content: chunk.content,
          url: chunk.url || '',
          score: 0.5, // Default score for text matches
        }));
      }
    } catch (textError) {
      console.error('[LOCAL SEARCH] Text search error:', textError);
    }
    
    // Final fallback: Get most recent documents
    console.log('[LOCAL SEARCH] Falling back to recent documents');
    try {
      const recentResults = await db.execute(sql`
        SELECT 
          kc.id,
          kc.document_id AS "documentId", 
          kd.title,
          kc.content,
          kd.source_url AS url
        FROM knowledge_chunk kc
        JOIN knowledge_document kd ON kc.document_id = kd.id
        WHERE kd.user_id = ${userId}
        ORDER BY kd.created_at DESC
        LIMIT ${limit}
      `);
      
      console.log(`[LOCAL SEARCH] Returning ${recentResults.length} recent documents`);
      
      // Format results
      return recentResults.map((chunk: any) => ({
        id: chunk.id,
        documentId: chunk.documentid,
        title: chunk.title || 'Untitled Document',
        content: chunk.content,
        url: chunk.url || '',
        score: 0.1, // Lower score for recent but not matching
      }));
    } catch (recentError) {
      console.error('[LOCAL SEARCH] Recent documents error:', recentError);
    }
    
    // Final fallback - use local files if nothing else works
    console.log('[LOCAL SEARCH] Using fallback local file search');
    const fallbackResults = getFallbackResults(query, userId, limit);
    
    if (fallbackResults.length > 0) {
      console.log(`[LOCAL SEARCH] Found ${fallbackResults.length} results using fallback search`);
      return fallbackResults;
    }
    
    // If all else fails, return empty array
    console.log('[LOCAL SEARCH] No results found');
    return [];
  } catch (error) {
    console.error('[LOCAL SEARCH] Error in knowledge search:', error);
    throw error;
  }
}
