import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { generateEmbeddings } from './embedding';
import { document, embeddings } from '../db/schema';

// Initialize database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Creates embeddings for a document and stores them in the database
 * @param documentId - ID of the document to create embeddings for
 * @param content - Content of the document
 */
export async function createDocumentEmbeddings(
  documentId: string,
  content: string,
) {
  try {
    // Generate embeddings for the document content
    const generatedEmbeddings = await generateEmbeddings(content);

    if (generatedEmbeddings.length === 0) {
      console.log(`No valid chunks found for document ${documentId}`);
      return;
    }

    // Insert embeddings into the database
    await db.insert(embeddings).values(
      generatedEmbeddings.map((embedding) => ({
        resourceId: documentId,
        ...embedding,
      })),
    );

    console.log(
      `Created ${generatedEmbeddings.length} embeddings for document ${documentId}`,
    );
  } catch (error) {
    console.error('Error creating document embeddings:', error);
    throw error;
  }
}

/**
 * Processes a document to create embeddings
 * This function can be called when a new document is created
 * @param documentId - ID of the document to process
 */
export async function processDocumentForRAG(documentId: string) {
  try {
    // Get the document from the database
    const [doc] = await db
      .select({
        id: document.id,
        content: document.content,
      })
      .from(document)
      .where(eq(document.id, documentId));

    if (!doc || !doc.content) {
      console.error(`Document ${documentId} not found or has no content`);
      return;
    }

    // Create embeddings for the document
    await createDocumentEmbeddings(documentId, doc.content);
  } catch (error) {
    console.error('Error processing document for RAG:', error);
    throw error;
  }
}
