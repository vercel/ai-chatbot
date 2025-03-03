import { type DataStream, type Session } from 'ai';
import OpenAI from 'openai';
import { KnowledgeReference } from '@/components/knowledge-references';
import fs from 'fs';
import path from 'path';

// Create OpenAI client
const openai = new OpenAI();

// Cache directory for embeddings
const CACHE_DIR = path.join(process.cwd(), '.cache', 'embeddings');

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`Created embeddings cache directory at ${CACHE_DIR}`);
  }
} catch (error) {
  console.error('Error creating cache directory:', error);
}

interface SearchKnowledgeParams {
  session: Session | null;
  dataStream: DataStream;
  onChunksUsed: (chunks: Array<{ id: string; content: string }>) => void;
}

export function searchKnowledge({
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
    console.log(`\n[KNOWLEDGE SEARCH] Query: "${query}", Limit: ${limit}`);
    
    if (!session?.user) {
      console.error('[KNOWLEDGE SEARCH] Error: Unauthorized user');
      return {
        error: 'Unauthorized',
      };
    }

    try {
      // Check if we have a cached embedding for this query
      const queryHash = Buffer.from(query).toString('base64');
      const cachePath = path.join(CACHE_DIR, `${queryHash}.json`);
      let embedding: number[] = [];

      // Try to load from cache first
      if (fs.existsSync(cachePath)) {
        try {
          const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
          embedding = cachedData.embedding;
          console.log(`[KNOWLEDGE SEARCH] Using cached embedding for query "${query}"`);
        } catch (error) {
          console.error(`[KNOWLEDGE SEARCH] Error reading cache:`, error);
        }
      }

      // Generate embedding if not in cache
      if (embedding.length === 0) {
        console.log(`[KNOWLEDGE SEARCH] Generating new embedding for query "${query}" using OpenAI API`);
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: query,
          });

          console.log(`[KNOWLEDGE SEARCH] Successfully received embedding from OpenAI API`);
          embedding = embeddingResponse.data[0].embedding;
          
          // Save to cache
          try {
            fs.writeFileSync(cachePath, JSON.stringify({ 
              query,
              embedding,
              timestamp: new Date().toISOString()
            }));
            console.log(`[KNOWLEDGE SEARCH] Saved embedding to cache for query "${query}"`);
          } catch (error) {
            console.error(`[KNOWLEDGE SEARCH] Error saving to cache:`, error);
            console.error(error);
          }
        } catch (error) {
          console.error('[KNOWLEDGE SEARCH] Error generating embedding with OpenAI:');
          console.error(error);
          
          if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
          }
          
          // Fallback to simple search without embeddings
          console.log('[KNOWLEDGE SEARCH] Falling back to simple search without embeddings');
          embedding = Array(1536).fill(0); // Create a dummy embedding
        }
      }

      console.log(`[KNOWLEDGE SEARCH] Searching knowledge base with embedding...`);
      
      // Perform semantic search
      try {
        const response = await fetch('/api/knowledge/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            embedding,
            limit: Number(limit),
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const results = await response.json();
        console.log(`[KNOWLEDGE SEARCH] Found ${results.length} relevant chunks of information`);

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
        dataStream.append({
          knowledgeReferences,
        });

        console.log(`[KNOWLEDGE SEARCH] Added ${knowledgeReferences.length} references to message`);

        // Format the results for the AI
        const formattedResults = results.map((result: any, index: number) => {
          return `[${index + 1}] ${result.content}`;
        }).join('\n\n');

        return {
          relevantContent: formattedResults,
          count: results.length,
          references: knowledgeReferences,
        };
      } catch (error) {
        console.error('[KNOWLEDGE SEARCH] Error with knowledge search API call:', error);
        throw error;
      }
    } catch (error) {
      console.error('[KNOWLEDGE SEARCH] Error searching knowledge base:', error);
      // Return a more detailed error message
      return {
        error: `Failed to search knowledge base: ${error.message || 'Unknown error'}`,
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  };
} 