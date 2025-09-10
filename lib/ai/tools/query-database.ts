import { tool } from 'ai';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export const queryDatabase = tool({
  description: `Execute read-only SQL queries against the database to retrieve information for admin users. 
  Use this tool when users ask for data like:
  - "Show me the 10 most recent users who signed up"
  - "List browsing history for phone number X"  
  - "How many users registered this month"
  - "Get user activity statistics"
  
  Available tables:
  - User: id, email, password (users who registered)
  - Chat: id, createdAt, title, userId, visibility (chat conversations)
  - Message_v2: id, chatId, role, parts, attachments, createdAt (chat messages)
  - Document: id, createdAt, title, content, kind, userId (generated documents)
  - Vote_v2: chatId, messageId, isUpvoted (message feedback)
  
  Always use safe, read-only queries with proper LIMIT clauses.`,
  
  inputSchema: z.object({
    query: z.string().describe('The SQL query to execute (SELECT statements only)'),
    description: z.string().describe('Brief description of what this query does')
  }),
  
  execute: async ({ query, description }) => {
    try {
      // Security: Only allow SELECT statements
      const cleanQuery = query.trim().toLowerCase();
      if (!cleanQuery.startsWith('select')) {
        return {
          error: 'Only SELECT queries are allowed for security reasons',
          data: null
        };
      }

      // Additional security checks
      const forbiddenKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
      if (forbiddenKeywords.some(keyword => cleanQuery.includes(keyword))) {
        return {
          error: 'Query contains forbidden keywords. Only SELECT queries are allowed.',
          data: null
        };
      }

      console.log(`[DB Query Tool] Executing: ${description}`);
      console.log(`[DB Query Tool] SQL: ${query}`);

      // Execute the query using Drizzle's sql template
      const result = await db.execute(sql.raw(query));
      
      return {
        description,
        data: result,
        rowCount: result.length,
        query: query
      };
      
    } catch (error: any) {
      console.error('[DB Query Tool] Error:', error);
      return {
        error: `Database query failed: ${error.message}`,
        data: null,
        query: query
      };
    }
  },
});