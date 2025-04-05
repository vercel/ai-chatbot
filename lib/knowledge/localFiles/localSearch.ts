import { getEmbedding } from './fileHandler';
import OpenAI from 'openai';
import { knowledgeChunk, knowledgeDocument } from '../../db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { getFallbackResults } from './fallbackResults';
import { basicKnowledgeSearch, normalizeText, preprocessQuery } from '../../db/schemaAdapter';

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
  limit: number = 5,
  documentIds?: string[] // Add filter by document IDs
): Promise<any[]> {
  console.log(`[LOCAL SEARCH] Searching knowledge for query: "${query.substring(0, 50)}..."`);
  if (DEBUG_MODE) {
    console.log(`[LOCAL SEARCH] Search details:\n- User ID: ${userId}\n- Limit: ${limit}\n- Document filter: ${documentIds ? `${documentIds.length} docs` : 'none'}\n- Full query: ${query}`);
  }
  if (DEBUG_MODE) {
    console.log(`[LOCAL SEARCH] Search details:\n- User ID: ${userId}\n- Limit: ${limit}\n- Full query: ${query}`);
  }
  
  try {
    // Normalize the query text for better matching, especially for Arabic
    const normalizedQuery = normalizeText(query);
    if (normalizedQuery !== query) {
      console.log(`[LOCAL SEARCH] Normalized query for better matching: "${normalizedQuery.substring(0, 50)}..."`);
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
    
    // Simplified search strategy: try direct schema adapter search first, then fallback
    try {
      console.log('[LOCAL SEARCH] Using direct schema adapter search');
      
      // This will now use the normalized query and proper Drizzle ORM calls
      const directResults = await basicKnowledgeSearch(normalizedQuery, userId, limit, documentIds);
      
      if (directResults.length > 0) {
        console.log(`[LOCAL SEARCH] Found ${directResults.length} results using direct search`);
        return directResults;
      }
    } catch (directError) {
      console.error('[LOCAL SEARCH] Direct search error:', directError);
    }
    
    // Simple fallback to recent documents
    console.log('[LOCAL SEARCH] Falling back to recent documents');
    try {
      // Use the improved basicKnowledgeSearch for fallback too - it already has recent docs fallback
      const fallbackResults = await basicKnowledgeSearch('', userId, limit); // Empty query gets recent docs
      
      if (fallbackResults.length > 0) {
        console.log(`[LOCAL SEARCH] Returning ${fallbackResults.length} recent documents`);
        return fallbackResults;
      }
    } catch (fallbackError) {
      console.error('[LOCAL SEARCH] Fallback search error:', fallbackError);
    }
    
    // Last resort - use local files if nothing else works
    console.log('[LOCAL SEARCH] Using fallback local file search');
    const localFallbackResults = getFallbackResults(query, userId, limit);
    
    if (localFallbackResults.length > 0) {
      console.log(`[LOCAL SEARCH] Found ${localFallbackResults.length} results using local fallback search`);
      return localFallbackResults;
    }
    
    // If all else fails, return empty array
    console.log('[LOCAL SEARCH] No results found');
    return [];
  } catch (error) {
    console.error('[LOCAL SEARCH] Error in knowledge search:', error);
    // Return empty array instead of throwing to improve resilience
    return [];
  }
}