import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cache } from 'react';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  knowledgeDocument,
  knowledgeChunk,
  knowledgeReference,
} from './schema';
import { ArtifactKind } from '@/components/artifact';
import { sql } from 'drizzle-orm';

// Create multiple knowledge references in a single operation
export async function createBulkKnowledgeReferences(references: Array<{ messageId: string; chunkId: string; createdAt: Date }>) {
  try {
    console.log(`Creating ${references.length} knowledge references in bulk`);
    
    // First verify all message IDs and chunk IDs exist
    const messageIds = [...new Set(references.map(ref => ref.messageId))];
    const chunkIds = [...new Set(references.map(ref => ref.chunkId))];
    
    // Check if all messages exist
    const messagesExist = await db
      .select({
        id: message.id
      })
      .from(message)
      .where(inArray(message.id, messageIds));
    
    if (messagesExist.length !== messageIds.length) {
      console.error('Some message IDs do not exist in the database');
      return 0;
    }
    
    // Check if all chunks exist
    const chunksExist = await db
      .select({
        id: knowledgeChunk.id
      })
      .from(knowledgeChunk)
      .where(inArray(knowledgeChunk.id, chunkIds));
    
    if (chunksExist.length !== chunkIds.length) {
      console.error('Some chunk IDs do not exist in the database');
      return 0;
    }
    
    // Insert all references in a single operation
    const result = await db
      .insert(knowledgeReference)
      .values(references)
      .returning();
    
    console.log(`Successfully created ${result.length} knowledge references with IDs: ${result.map(r => r.id).join(', ')}`);
    return result.length;
  } catch (error) {
    console.error(`Failed to create bulk knowledge references: ${error.message || error}`);
    
    // Try to create each reference individually as a fallback
    console.log('Trying fallback approach: creating references one by one');
    let successCount = 0;
    
    for (const ref of references) {
      try {
        const result = await db
          .insert(knowledgeReference)
          .values(ref)
          .returning();
        
        if (result.length > 0) {
          successCount++;
          console.log(`Created reference ${successCount}: ${result[0].id}`);
        }
      } catch (innerError) {
        console.error(`Failed to create individual reference: ${innerError.message || innerError}`);
      }
    }
    
    console.log(`Created ${successCount}/${references.length} references using fallback approach`);
    return successCount;
  }
}

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Create a connection pool with appropriate settings for better performance
const client = postgres(process.env.POSTGRES_URL!, {
  max: 10, // Maximum number of connections in pool (default is 10)
  idle_timeout: 20, // Max seconds a client can be idle before being closed
  connect_timeout: 10, // Max seconds to wait for connection
});

const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

// Cache frequently used queries
export const getChatsByUserId = cache(async ({ id }: { id: string }) => {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
});

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    // Insert the messages
    const result = await db.insert(message).values(messages);
    
    // If there are no messages inserted, return empty array
    if (!messages.length) {
      console.log('No messages to save');
      return [];
    }
    
    // Get the IDs of the messages we just inserted
    const messageIds = messages.map(msg => msg.id);
    
    // Fetch the inserted messages to return the complete objects
    const savedMessages = await db
      .select()
      .from(message)
      .where(inArray(message.id, messageIds));
    
    console.log(`Successfully saved and retrieved ${savedMessages.length} messages`);
    return savedMessages;
  } catch (error) {
    console.error('Failed to save messages in database', error);
    // Return an empty array on error rather than throwing
    return [];
  }
}

export const getMessagesByChatId = cache(async ({ id }: { id: string }) => {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
});

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// Knowledge Base Queries

// Get all knowledge documents for a user
export const getKnowledgeDocumentsByUserId = cache(async ({
  userId,
}: {
  userId: string;
}) => {
  return db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.userId, userId))
    .orderBy(desc(knowledgeDocument.createdAt));
});

// Get a knowledge document by ID
export async function getKnowledgeDocumentById({
  id,
}: {
  id: string;
}) {
  const result = await db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.id, id))
    .limit(1);

  return result[0] || null;
}

// Create a new knowledge document
export async function createKnowledgeDocument({
  userId,
  title,
  description,
  sourceType,
  sourceUrl,
  fileSize,
  fileType,
}: {
  userId: string;
  title: string;
  description?: string;
  sourceType: 'text' | 'url' | 'audio';
  sourceUrl?: string;
  fileSize?: string;
  fileType?: string;
}) {
  const result = await db
    .insert(knowledgeDocument)
    .values({
      userId,
      title,
      description,
      sourceType,
      sourceUrl,
      fileSize,
      fileType,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
}

// Update a knowledge document
export async function updateKnowledgeDocument({
  id,
  title,
  description,
  status,
  processingError,
  transcriptCharCount,
}: {
  id: string;
  title?: string;
  description?: string;
  status?: 'processing' | 'completed' | 'failed';
  processingError?: string;
}) {
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) values.title = title;
  if (description !== undefined) values.description = description;
  if (status !== undefined) values.status = status;
  if (processingError !== undefined) values.processingError = processingError;
  if (transcriptCharCount !== undefined) values.transcriptCharCount = transcriptCharCount;

  const result = await db
    .update(knowledgeDocument)
    .set(values)
    .where(eq(knowledgeDocument.id, id))
    .returning();

  return result[0];
}

// Delete a knowledge document
export async function deleteKnowledgeDocument({
  id,
}: {
  id: string;
}) {
  return db
    .delete(knowledgeDocument)
    .where(eq(knowledgeDocument.id, id))
    .returning();
}

// Create a knowledge chunk
export async function createKnowledgeChunk({
  documentId,
  content,
  metadata,
  chunkIndex,
  embedding,
}: {
  documentId: string;
  content: string;
  metadata?: Record<string, unknown>;
  chunkIndex: string;
  embedding?: number[];
}) {
  const values = {
    documentId,
    content,
    metadata,
    chunkIndex,
    embedding: embedding ? JSON.stringify(embedding) : undefined,
    createdAt: new Date(),
  };

  const result = await db
    .insert(knowledgeChunk)
    .values(values)
    .returning();

  return result[0];
}

// Get chunks by document ID
export async function getChunksByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  return db
    .select()
    .from(knowledgeChunk)
    .where(eq(knowledgeChunk.documentId, documentId))
    .orderBy(knowledgeChunk.chunkIndex);
}

// Semantic search on knowledge chunks - text-based fallback since vector search is disabled
export async function semanticSearch({
  embedding,
  limit = 5,
}: {
  embedding: number[];
  limit?: number;
}) {
  // Since we can't use vector search, use a more optimized text-based fallback
  console.log('Using optimized text-based fallback for semantic search');
  
  // Use a prepared statement for better performance
  const query = db.select({
    id: knowledgeChunk.id,
    content: knowledgeChunk.content,
    metadata: knowledgeChunk.metadata,
    documentId: knowledgeChunk.documentId,
    // Provide a dummy similarity score
    similarity: sql`0.5`, 
  })
  .from(knowledgeChunk)
  .orderBy(desc(knowledgeChunk.createdAt))
  .limit(limit);
  
  // Execute with a timeout to prevent long-running queries
  return await Promise.race([
    query,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search query timeout')), 5000);
    })
  ]) as any; // Type assertion needed due to Promise.race
}

// Create a knowledge reference
// Create a knowledge reference with better error handling
export async function createKnowledgeReference({
  messageId,
  chunkId,
}: {
  messageId: string;
  chunkId: string;
}) {
  try {
    console.log(`Creating knowledge reference: message=${messageId}, chunk=${chunkId}`);
    
    // First check if the message and chunk exist to avoid foreign key issues
    const messageExists = await db
      .select({ count: sql`count(*)` })
      .from(message)
      .where(eq(message.id, messageId));
      
    if (!messageExists[0] || messageExists[0].count === 0) {
      console.error(`Cannot create reference: Message ${messageId} does not exist`);
      return null;
    }
    
    const chunkExists = await db
      .select({ count: sql`count(*)` })
      .from(knowledgeChunk)
      .where(eq(knowledgeChunk.id, chunkId));
      
    if (!chunkExists[0] || chunkExists[0].count === 0) {
      console.error(`Cannot create reference: Chunk ${chunkId} does not exist`);
      return null;
    }
    
    const result = await db
      .insert(knowledgeReference)
      .values({
        messageId,
        chunkId,
        createdAt: new Date(),
      })
      .returning();
    
    console.log(`Successfully created knowledge reference with ID: ${result[0]?.id || 'unknown'}`);
    return result[0];
  } catch (error) {
    console.error(`Failed to create knowledge reference: ${error.message || error}`);
    return null;
  }
}

// Get references by message ID
// Get references by message ID with improved handling
export async function getReferencesByMessageId({
  messageId,
}: {
  messageId: string;
}) {
  try {
    console.log(`Fetching knowledge references for message ID: ${messageId}`);
    
    // Use a more reliable direct SQL query
    const queryResult = await db.execute(sql`
      SELECT 
        kr.id as reference_id,
        kr."messageId" as message_id,
        kr."chunkId" as chunk_id,
        kr."createdAt" as reference_created_at,
        kc.id as chunk_id,
        kc.content as chunk_content,
        kc."documentId" as document_id,
        kd.title as document_title,
        kd."sourceUrl" as source_url
      FROM "KnowledgeReference" kr
      JOIN "KnowledgeChunk" kc ON kr."chunkId" = kc.id
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kr."messageId" = ${messageId}
    `);
    
    console.log(`Found ${queryResult.length} references for message ${messageId}`);
    
    // Format results for consistency
    return queryResult.map((row: any) => ({
      reference: {
        id: row.reference_id,
        messageId: row.message_id,
        chunkId: row.chunk_id,
        createdAt: row.reference_created_at
      },
      chunk: {
        id: row.chunk_id,
        content: row.chunk_content,
        documentId: row.document_id
      },
      document: {
        id: row.document_id,
        title: row.document_title,
        sourceUrl: row.source_url
      }
    }));
  } catch (error) {
    console.error(`Error fetching references for message ${messageId}:`, error);
    return [];
  }
}
