import { auth } from '@/app/(auth)/auth';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { searchSimilarDocuments } from '@/lib/ai/search';
import { createDocumentEmbeddings } from '@/lib/ai/document-embeddings';
import { generateUUID } from '@/lib/utils';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document } from '@/lib/db/schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { messages } = await req.json();

    // Get the last user message for context retrieval
    const lastMessage = messages[messages.length - 1];

    const result = streamText({
      model: openai('gpt-4o'),
      messages,
      system: `You are a helpful AI assistant with access to a knowledge base of documents.
      Answer user questions based on relevant information from the knowledge base.
      If you don't find relevant information in the knowledge base, politely state that you don't have that information.
      Keep your answers concise and to the point.`,
      tools: {
        searchDocuments: tool({
          description: 'Search for relevant documents in the knowledge base',
          parameters: z.object({
            query: z.string().describe('The search query'),
          }),
          execute: async ({ query }) => {
            const results = await searchSimilarDocuments(query);
            if (results.length === 0) {
              return { documents: [], message: 'No relevant documents found.' };
            }
            return {
              documents: results,
              message: `Found ${results.length} relevant documents.`,
            };
          },
        }),
        saveDocument: tool({
          description: 'Save a new document to the knowledge base',
          parameters: z.object({
            title: z.string().describe('The title of the document'),
            content: z.string().describe('The content of the document'),
          }),
          execute: async ({ title, content }) => {
            // Create document in database
            // biome-ignore lint: Forbidden non-null assertion
            const client = postgres(process.env.POSTGRES_URL!);
            const db = drizzle(client);

            const documentId = generateUUID();
            const now = new Date();

            try {
              // Insert the document
              await db.insert(document).values({
                id: documentId,
                title,
                content,
                kind: 'text',
                userId: session.user.id,
                createdAt: now,
              });

              // Generate embeddings for the document
              await createDocumentEmbeddings(documentId, content);

              await client.end();

              return {
                success: true,
                message: 'Document saved and indexed successfully.',
                documentId,
              };
            } catch (error) {
              console.error('Error saving document:', error);
              await client.end();
              return {
                success: false,
                message: 'Failed to save document. Please try again.',
              };
            }
          },
        }),
      },
      maxSteps: 3, // Allow multiple tool calls if needed
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in RAG endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
