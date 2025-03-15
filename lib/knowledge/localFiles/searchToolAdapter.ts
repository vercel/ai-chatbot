import { type DataStream, type Session } from 'ai';
import { searchKnowledgeLocal } from './localSearch';
import { KnowledgeReference } from '@/components/knowledge-references';

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
      // Use our local search implementation
      console.log(`[SEARCH TOOL] Searching knowledge base...`);
      const results = await searchKnowledgeLocal(query, session.user.id, Number(limit));
      
      console.log(`[SEARCH TOOL] Found ${results.length} relevant chunks of information`);

      // Track the chunks that were used
      const usedChunks = results.map((result: any) => ({
        id: result.id,
        content: result.content,
      }));
      
      onChunksUsed(usedChunks);

      // Store knowledge references in the message
      const knowledgeReferences: KnowledgeReference[] = results.map((result: any) => ({
        id: result.id,
        title: result.title,
        content: result.content,
        score: result.score,
        url: result.url,
      }));

      // Add knowledge references to the message
      // Check if dataStream has append method before calling it
      if (dataStream && typeof dataStream.append === 'function') {
        try {
          dataStream.append({
            knowledgeReferences,
          });
          console.log(`[SEARCH TOOL] Added ${knowledgeReferences.length} references to message using dataStream.append()`);
        } catch (appendError) {
          console.error('[SEARCH TOOL] Error appending to dataStream:', appendError);
        }
      } else {
        console.log('[SEARCH TOOL] dataStream.append is not a function, skipping reference append');
      }

      // Format the results for the AI
      const formattedResults = results.map((result: any, index: number) => {
        return `[${index + 1}] ${result.content}`;
      }).join('\n\n');

      // If we found results, be explicit with the AI
      if (results.length > 0) {
        return {
          relevantContent: formattedResults,
          count: results.length,
          references: knowledgeReferences,
          message: "Here are relevant passages from your knowledge base. Use this information to respond to the user's query."
        };
      } else {
        // No results found - make it clear to the AI
        return {
          relevantContent: "",
          count: 0,
          references: [],
          message: "No relevant information found in the knowledge base. Please respond based on your general knowledge or ask the user for more information."
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
