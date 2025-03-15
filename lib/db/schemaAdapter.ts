/**
 * This adapter handles mismatches between database schema and code
 * It takes care of column name casing and provides fallbacks
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Initialize database client
const postgresUrl = process.env.POSTGRES_URL!;
const client = postgres(postgresUrl);
export const db = drizzle(client);

// Schema mapping
// Maps the column/table names as they appear in code to how they exist in the database
const TABLE_MAP: Record<string, string> = {
  'knowledge_chunk': 'KnowledgeChunk',
  'knowledge_document': 'KnowledgeDocument',
  'knowledge_reference': 'KnowledgeReference',
};

/**
 * Gets the correct table name for a given table
 * This handles case sensitivity issues between code and database
 */
export function getTableName(tableName: string): string {
  return TABLE_MAP[tableName] || tableName;
}

/**
 * Execute a query with proper table name mapping
 */
export async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  // Replace table names in the query
  let modifiedQuery = query;
  
  for (const [codeName, dbName] of Object.entries(TABLE_MAP)) {
    // Replace occurrences in the FROM clause
    modifiedQuery = modifiedQuery.replace(
      new RegExp(`FROM\\s+${codeName}\\b`, 'gi'),
      `FROM "${dbName}"`
    );
    
    // Replace occurrences in JOIN clauses
    modifiedQuery = modifiedQuery.replace(
      new RegExp(`JOIN\\s+${codeName}\\b`, 'gi'),
      `JOIN "${dbName}"`
    );
  }
  
  try {
    return await db.execute(sql.raw(modifiedQuery, params));
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * Does a basic search in the knowledge base without using vector search
 */
export async function basicKnowledgeSearch(
  searchQuery: string,
  userId: string,
  limit: number = 5
): Promise<any[]> {
  try {
    // Try text matching with case-insensitive search in "content" field
    const sqlQuery = `
      SELECT 
        kc.id, 
        kc."documentId" AS "documentId",
        kd.title,
        kc.content,
        kd."sourceUrl" AS url
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kd."userId" = $1
      AND kc.content ILIKE $2
      ORDER BY kd."createdAt" DESC
      LIMIT $3
    `;
    
    const params = [userId, `%${searchQuery}%`, limit];
    const results = await db.execute(sql.raw(sqlQuery, params));
    
    if (results.length > 0) {
      return results.map((chunk: any) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        title: chunk.title || 'Untitled Document',
        content: chunk.content,
        url: chunk.url || '',
        score: 0.5, // Default score for text matching
      }));
    }
    
    // If no text matches, return most recent documents as a fallback
    const recentQuery = `
      SELECT 
        kc.id,
        kc."documentId" AS "documentId",
        kd.title,
        kc.content,
        kd."sourceUrl" AS url
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kd."userId" = $1
      ORDER BY kd."createdAt" DESC
      LIMIT $2
    `;
    
    const recentParams = [userId, limit];
    const recentResults = await db.execute(sql.raw(recentQuery, recentParams));
    
    return recentResults.map((chunk: any) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      title: chunk.title || 'Untitled Document',
      content: chunk.content,
      url: chunk.url || '',
      score: 0.1, // Lower score for recent but not matching
    }));
  } catch (error) {
    console.error('Error in basic knowledge search:', error);
    throw error;
  }
}
