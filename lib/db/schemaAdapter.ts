/**
 * This adapter handles mismatches between database schema and code
 * It takes care of column name casing and provides fallbacks
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, desc, eq, and } from 'drizzle-orm';
import { knowledgeChunk, knowledgeDocument } from './schema';

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
 * Normalize text for better search, especially for non-Latin scripts like Arabic
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  try {
    // Basic normalization - first normalize Unicode representation
    const normalized = text.normalize('NFKD');
    
    // Remove Arabic diacritical marks (tashkeel) for better matching
    let result = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
    
    // Normalize Arabic letter forms (alef with hamza, etc.)
    // Map various forms of alef to simple alef
    result = result.replace(/[\u0622\u0623\u0625]/g, '\u0627');
    
    // Normalize ya and alef maqsura
    result = result.replace(/\u0649/g, '\u064A');
    
    // Remove non-Arabic, non-Latin characters that might interfere with matching
    // but preserve spaces, numbers and basic punctuation
    result = result.replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s.,?!-]/g, '');
    
    // Convert all to lowercase for case-insensitive matching
    return result.toLowerCase();
  } catch (error) {
    console.error('Error normalizing text:', error);
    return text; // Return original if normalization fails
  }
}

/**
 * Preprocess query for better search results
 * This extracts key terms and enhances search relevance
 */
export function preprocessQuery(query: string): string {
  if (!query) return '';
  
  try {
    // Normalize the query text first
    const normalizedQuery = normalizeText(query);
    
    // Check if the query is in Arabic (contains Arabic characters)
    const hasArabic = /[\u0600-\u06FF]/.test(normalizedQuery);
    
    if (hasArabic) {
      // For Arabic, extract key terms specific to Arabic structure
      
      // Common Arabic patterns for "my role at company"
      // For example: "دوري في شركة" or "منصبي في"
      const arabicRoleMatches = normalizedQuery.match(/(?:دور|منصب|وظيفة|عمل)[^\s]*(?:\s+في|\s+ب|\s+مع|\s+ل)\s+([\u0600-\u06FF\s]{2,})/i);
      
      if (arabicRoleMatches && arabicRoleMatches[1]) {
        const companyName = arabicRoleMatches[1].trim();
        // Add both company name and common role terms
        return `${companyName} دور منصب وظيفة عمل`;
      }
      
      // Look for company names after prepositions
      const arabicCompanyMatches = normalizedQuery.match(/(?:في|ب|مع|ل)\s+([\u0600-\u06FF\s]{2,})/i);
      if (arabicCompanyMatches && arabicCompanyMatches[1]) {
        const company = arabicCompanyMatches[1].trim();
        if (company.length > 2) {
          return company;
        }
      }
      
      // Look for skills/experience patterns in Arabic
      const arabicSkillMatches = normalizedQuery.match(/(?:مهارات|خبرة|خبرات|معرفة)(?:\s+في|\s+ب|\s+مع)\s+([\u0600-\u06FF\s]{2,})/i);
      if (arabicSkillMatches && arabicSkillMatches[1]) {
        return arabicSkillMatches[1].trim();
      }
      
      // Default to the normalized Arabic query
      return normalizedQuery;
    } else {
      // English processing
      // Extract key terms for resume/CV specific queries
      const roleMatches = normalizedQuery.match(/\b(role|position|title|job|work)\s+(at|in|with|for)\s+([\w\s&]+)\b/i);
      if (roleMatches && roleMatches[3]) {
        const company = roleMatches[3].trim();
        return `${company} role position title job`;
      }
      
      // Extract company name queries
      const companyMatches = normalizedQuery.match(/\b(at|in|with|for)\s+([\w\s&]+)\b/i);
      if (companyMatches && companyMatches[2]) {
        const company = companyMatches[2].trim();
        if (company.length > 2) { // Avoid matching short prepositions
          return company;
        }
      }
      
      // Extract skill/experience queries
      const skillMatches = normalizedQuery.match(/\b(skill|experience|expertise|knowledge)\s+(in|with|of)\s+([\w\s&]+)\b/i);
      if (skillMatches && skillMatches[3]) {
        return skillMatches[3].trim();
      }
      
      // Default to the normalized query for other types
      return normalizedQuery;
    }
  } catch (error) {
    console.error('Error preprocessing query:', error);
    return query; // Return original if preprocessing fails
  }
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
 * Enhanced with full-text search and query preprocessing
 */
export async function basicKnowledgeSearch(
  searchQuery: string,
  userId: string,
  limit: number = 5
): Promise<any[]> {
  try {
    console.log(`Basic knowledge search: "${searchQuery.substring(0, 50)}..." for user ${userId}`);
    
    // Normalize and preprocess the search query for better matching
    const normalizedQuery = normalizeText(searchQuery);
    const processedQuery = preprocessQuery(searchQuery);
    
    console.log(`Normalized query: "${normalizedQuery.substring(0, 50)}..."`);
    if (processedQuery !== normalizedQuery) {
      console.log(`Preprocessed query: "${processedQuery.substring(0, 50)}..."`);
    }
    
    // Try full-text search first if available
    try {
      // Check if content_tsv column exists using SQL metadata
      const columnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'KnowledgeChunk' 
          AND column_name = 'content_tsv'
        ) as has_column;
      `);
      
      const hasTsvColumn = columnCheck[0]?.has_column === true;
      
      if (hasTsvColumn) {
        console.log(`Using PostgreSQL full-text search with processed query`);
        
        // Create a proper tsquery from the processed query
        // Replace spaces with & for AND logic in full-text search
        const searchTerms = processedQuery.split(/\s+/).filter(term => term.length > 1);
        const tsQueryString = searchTerms.join(' & ');
        
        if (tsQueryString) {
          // Use full-text search with proper ranking
          const results = await db.execute(sql`
            SELECT 
              kc.id,
              kc."documentId", 
              kd.title,
              kc.content,
              kd."sourceUrl" as url,
              ts_rank(kc.content_tsv, to_tsquery('english', ${tsQueryString})) as score
            FROM "KnowledgeChunk" kc
            JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
            WHERE kd."userId" = ${userId}
            AND kc.content_tsv @@ to_tsquery('english', ${tsQueryString})
            ORDER BY score DESC
            LIMIT ${limit}
          `);
          
          if (results.length > 0) {
            console.log(`Found ${results.length} results using full-text search`);
            return results.map((chunk: any) => ({
              id: chunk.id,
              documentId: chunk.documentid,
              title: chunk.title || 'Untitled Document',
              content: chunk.content,
              url: chunk.url || '',
              score: parseFloat(chunk.score) || 0.7, // Use actual rank if available
            }));
          }
        }
      }
      
      // Fall back to ILIKE search if full-text search failed or returned no results
      console.log(`Falling back to ILIKE text search`);
      
      // Try with the processed query first
      const processedResults = await db
        .select({
          id: knowledgeChunk.id,
          documentId: knowledgeChunk.documentId,
          title: knowledgeDocument.title,
          content: knowledgeChunk.content,
          url: knowledgeDocument.sourceUrl,
        })
        .from(knowledgeChunk)
        .innerJoin(
          knowledgeDocument,
          eq(knowledgeChunk.documentId, knowledgeDocument.id)
        )
        .where(
          and(
            eq(knowledgeDocument.userId, userId),
            sql`${knowledgeChunk.content} ILIKE ${`%${processedQuery}%`}`
          )
        )
        .orderBy(desc(knowledgeDocument.createdAt))
        .limit(limit);
      
      if (processedResults.length > 0) {
        console.log(`Found ${processedResults.length} results using processed query text search`);
        return processedResults.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.documentId,
          title: chunk.title || 'Untitled Document',
          content: chunk.content,
          url: chunk.url || '',
          score: 0.6, // Higher score for processed query matches
        }));
      }
      
      // If processed query failed, try the original normalized query
      const normalizedResults = await db
        .select({
          id: knowledgeChunk.id,
          documentId: knowledgeChunk.documentId,
          title: knowledgeDocument.title,
          content: knowledgeChunk.content,
          url: knowledgeDocument.sourceUrl,
        })
        .from(knowledgeChunk)
        .innerJoin(
          knowledgeDocument,
          eq(knowledgeChunk.documentId, knowledgeDocument.id)
        )
        .where(
          and(
            eq(knowledgeDocument.userId, userId),
            sql`${knowledgeChunk.content} ILIKE ${`%${normalizedQuery}%`}`
          )
        )
        .orderBy(desc(knowledgeDocument.createdAt))
        .limit(limit);

      if (normalizedResults.length > 0) {
        console.log(`Found ${normalizedResults.length} results using normalized text search`);
        return normalizedResults.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.documentId,
          title: chunk.title || 'Untitled Document',
          content: chunk.content,
          url: chunk.url || '',
          score: 0.5, // Default score for text matching
        }));
      }
    } catch (searchError) {
      console.error('Error in text search:', searchError);
      // Continue to fallback
    }
    
    // If no text matches, return most recent documents as a fallback
    console.log('Falling back to recent documents');
    try {
      const recentResults = await db
        .select({
          id: knowledgeChunk.id,
          documentId: knowledgeChunk.documentId,
          title: knowledgeDocument.title,
          content: knowledgeChunk.content,
          url: knowledgeDocument.sourceUrl,
        })
        .from(knowledgeChunk)
        .innerJoin(
          knowledgeDocument,
          eq(knowledgeChunk.documentId, knowledgeDocument.id)
        )
        .where(eq(knowledgeDocument.userId, userId))
        .orderBy(desc(knowledgeDocument.createdAt))
        .limit(limit);

      console.log(`Found ${recentResults.length} recent documents`);
      
      return recentResults.map((chunk: any) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        title: chunk.title || 'Untitled Document',
        content: chunk.content,
        url: chunk.url || '',
        score: 0.1, // Lower score for recent but not matching
      }));
    } catch (recentError) {
      console.error('Error fetching recent documents:', recentError);
      return []; // Return empty array on complete failure
    }
  } catch (error) {
    console.error('Error in basic knowledge search:', error);
    return []; // Return empty array instead of throwing to improve resilience
  }
}
