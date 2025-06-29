import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { resource, resourceChunk } from '../lib/db/schema.js';
import type { DocumentChunk, Embedding } from './types.js';

// Create database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getResourceBySourceUri(sourceUri: string) {
  try {
    const results = await db.select().from(resource).where(eq(resource.sourceUri, sourceUri));
    return results[0] || null;
  } catch (error) {
    console.error('Failed to get resource by source URI:', error);
    throw error;
  }
}

export async function createResource({
  sourceType,
  sourceUri,
  contentHash,
}: {
  sourceType: 'file' | 'url' | 'github';
  sourceUri: string;
  contentHash: string;
}) {
  try {
    const results = await db.insert(resource).values({
      sourceType,
      sourceUri,
      contentHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return results[0];
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
}

export async function updateResourceContentHash({
  id,
  contentHash,
}: {
  id: string;
  contentHash: string;
}) {
  try {
    const results = await db.update(resource)
      .set({ 
        contentHash, 
        updatedAt: new Date() 
      })
      .where(eq(resource.id, id))
      .returning();
    return results[0];
  } catch (error) {
    console.error('Failed to update resource content hash:', error);
    throw error;
  }
}

export async function deleteResource(id: string) {
  try {
    // ResourceChunks will be deleted automatically due to cascade delete
    await db.delete(resource).where(eq(resource.id, id));
  } catch (error) {
    console.error('Failed to delete resource:', error);
    throw error;
  }
}

export async function createResourceChunks({
  resourceId,
  chunksWithEmbeddings,
}: {
  resourceId: string;
  chunksWithEmbeddings: [DocumentChunk, Embedding][];
}) {
  try {
    const chunkValues = chunksWithEmbeddings.map(([chunk, embedding]) => ({
      resourceId,
      content: chunk.content,
      embedding,
    }));
    
    return await db.insert(resourceChunk).values(chunkValues).returning();
  } catch (error) {
    console.error('Failed to create resource chunks:', error);
    throw error;
  }
}

export async function deleteResourceChunksByResourceId(resourceId: string) {
  try {
    await db.delete(resourceChunk).where(eq(resourceChunk.resourceId, resourceId));
  } catch (error) {
    console.error('Failed to delete resource chunks:', error);
    throw error;
  }
}

export async function getResourcesBySourceType(sourceType: 'file' | 'url' | 'github') {
  try {
    return await db.select().from(resource).where(eq(resource.sourceType, sourceType));
  } catch (error) {
    console.error('Failed to get resources by source type:', error);
    throw error;
  }
} 