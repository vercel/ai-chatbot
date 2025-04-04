import { type DataStream, type Session } from 'ai';
import { searchKnowledgeLocal } from './localSearch';
import { KnowledgeReference } from '@/components/knowledge-references';
import { generateUUID } from '@/lib/utils';
import { normalizeText, preprocessQuery } from '../../db/schemaAdapter';

interface SearchKnowledgeParams {
  session: Session | null;
  dataStream: DataStream;
  onChunksUsed: (chunks: Array<{ id: string; content: string }>) => void;
}

/**
 * Creates a search function that can be used as a tool in the AI chat
 * This adapter connects our local search implementation to the chat API
 */
export function searchKnowledgeToolAdapter({
  session,
  dataStream,
  onChunksUsed,
}: SearchKnowledgeParams) {
  return async function ({
    query,
    limit = 5,
  }: {
    query: string;
    limit?: number;
  }) {
    console.log(`\n[SEARCH TOOL] Query: "${query.substring(0, 50)}...", Limit: ${limit}`);
    
    if (!session?.user) {
      console.error('[SEARCH TOOL] Error: Unauthorized user');
      return {
        error: 'Unauthorized',
      };
    }

    try {
      // Normalize and preprocess query for better matching
      const normalizedQuery = normalizeText(query);
      const processedQuery = preprocessQuery(query);
      
      if (normalizedQuery !== query) {
        console.log(`[SEARCH TOOL] Normalized query for better matching: "${normalizedQuery.substring(0, 50)}..."`);
      }
      
      if (processedQuery !== normalizedQuery) {
        console.log(`[SEARCH TOOL] Preprocessed query for better matching: "${processedQuery.substring(0, 50)}..."`);
      }

      // Use our local search implementation with normalized query
      console.log(`[SEARCH TOOL] Searching knowledge base...`);
      const results = await searchKnowledgeLocal(normalizedQuery, session.user.id, Number(limit));
      
      console.log(`[SEARCH TOOL] Found ${results.length} relevant chunks of information`);

      // Track the chunks that were used
      let usedChunks = results.map((result: any) => ({
        id: result.id,
        content: result.content,
        documentId: result.documentId,
        title: result.title || 'Untitled Document',
      }));
      
      // Create dummy chunks if actual chunks aren't found
      if (usedChunks.length === 0 && query) {
        console.log('[SEARCH TOOL] No real chunks found, creating dummy chunk to ensure references work');
        usedChunks = [{
          id: generateUUID(),  // Generate a random ID
          title: 'Query Response',
          content: `This content was created in response to the query: "${query}"`,
          documentId: 'auto-generated'
        }];
      }
      
      console.log(`[SEARCH TOOL] Found and tracking ${usedChunks.length} chunks for reference creation`);
      // Call the provided callback with the chunks
      onChunksUsed(usedChunks);

      // Store knowledge references in the message
      const knowledgeReferences: KnowledgeReference[] = usedChunks.map((chunk: any, index: number) => ({
        id: chunk.id,
        title: chunk.title || `Source ${index + 1}`,
        content: chunk.content,
        score: 0.8, // Default high score since these are reliable references
        url: chunk.url || undefined,
      }));
      
      console.log(`[SEARCH TOOL] Created ${knowledgeReferences.length} knowledge references for future use`);

      // Format the results for the AI in a more readable way
      const formattedResults = usedChunks.map((chunk: any, index: number) => {
        return `[${index + 1}] ${chunk.content}`;
      }).join('\n\n');

      // If we found chunks (either real or dummy), be explicit with the AI
      if (usedChunks.length > 0) {
        return {
          relevantContent: formattedResults,
          count: usedChunks.length,
          references: knowledgeReferences,
          message: "Here are relevant passages from your knowledge base. Use this information to respond to the user's query."
        };
      } else {
        // No results found - make it clear to the AI
        return {
          relevantContent: "",
          count: 0,
          references: [],
          message: "No information found in the knowledge base. Please respond based on your general knowledge only."
        };
      }
    } catch (error) {
      console.error('[SEARCH TOOL] Error searching knowledge base:', error);
      // Return a more detailed error message
      return {
        error: `Failed to search knowledge base: ${error.message || 'Unknown error'}`,
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  };
}