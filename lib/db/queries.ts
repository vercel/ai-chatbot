import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

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

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
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

export async function getChatsByUserId({ id }: { id: string }) {
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
}

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
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
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
}

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
export async function getKnowledgeDocumentsByUserId({
  userId,
}: {
  userId: string;
}) {
  return db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.userId, userId))
    .orderBy(desc(knowledgeDocument.createdAt));
}

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
  sourceType: 'pdf' | 'text' | 'url' | 'audio' | 'video' | 'youtube';
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
  const result = await db
    .insert(knowledgeChunk)
    .values({
      documentId,
      content,
      metadata,
      chunkIndex,
      embedding: embedding ? JSON.stringify(embedding) : undefined,
      createdAt: new Date(),
    })
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

// Semantic search on knowledge chunks
export async function semanticSearch({
  embedding,
  limit = 5,
}: {
  embedding: number[];
  limit?: number;
}) {
  // Since we're using text-based embeddings temporarily, return recent chunks
  // as a fallback (will be replaced with vector similarity when pgvector is available)
  return db
    .select({
      id: knowledgeChunk.id,
      content: knowledgeChunk.content,
      metadata: knowledgeChunk.metadata,
      documentId: knowledgeChunk.documentId,
      // Provide a dummy similarity score
      similarity: sql`0.95`, 
    })
    .from(knowledgeChunk)
    .orderBy(desc(knowledgeChunk.createdAt))
    .limit(limit);
}

// Create a knowledge reference
export async function createKnowledgeReference({
  messageId,
  chunkId,
}: {
  messageId: string;
  chunkId: string;
}) {
  const result = await db
    .insert(knowledgeReference)
    .values({
      messageId,
      chunkId,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}

// Get references by message ID
export async function getReferencesByMessageId({
  messageId,
}: {
  messageId: string;
}) {
  return db
    .select({
      reference: knowledgeReference,
      chunk: knowledgeChunk,
      document: knowledgeDocument,
    })
    .from(knowledgeReference)
    .innerJoin(
      knowledgeChunk,
      eq(knowledgeReference.chunkId, knowledgeChunk.id)
    )
    .innerJoin(
      knowledgeDocument,
      eq(knowledgeChunk.documentId, knowledgeDocument.id)
    )
    .where(eq(knowledgeReference.messageId, messageId));
}
