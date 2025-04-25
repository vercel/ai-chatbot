import 'server-only';

import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { unstable_cache } from 'next/cache';

import * as schema from './schema';
import type { ArtifactKind } from '@/components/artifact';
import type { VisibilityType } from '@/components/visibility-selector';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });

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
    return await db.insert(schema.Chat).values({
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
    await db.delete(schema.vote).where(eq(schema.vote.chatId, id));
    await db.delete(schema.Message_v2).where(eq(schema.Message_v2.chatId, id));

    return await db.delete(schema.Chat).where(eq(schema.Chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(schema.Chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.Chat.userId, id))
            : eq(schema.Chat.userId, id),
        )
        .orderBy(desc(schema.Chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<schema.DBChat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(schema.Chat)
        .where(eq(schema.Chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(
        gt(schema.Chat.createdAt, selectedChat.createdAt),
      );
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(schema.Chat)
        .where(eq(schema.Chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(
        lt(schema.Chat.createdAt, selectedChat.createdAt),
      );
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  // Define the cached function
  const getChatByIdCached = unstable_cache(
    async (chatId: string) => {
      console.log(`Cache miss: Fetching chat ${chatId} from DB`);
      // --- Start inner timer ---
      console.time(`getChatById DB Query - Chat ${chatId}`);
      // --- End inner timer ---
      try {
        // Original database query logic
        const [selectedChat] = await db
          .select()
          .from(schema.Chat)
          .where(eq(schema.Chat.id, chatId));
        // --- Start inner timer ---
        console.timeEnd(`getChatById DB Query - Chat ${chatId}`);
        // --- End inner timer ---
        return selectedChat;
      } catch (error) {
        // --- Start inner timer ---
        // Ensure timer ends even on error
        console.timeEnd(`getChatById DB Query - Chat ${chatId}`);
        // --- End inner timer ---
        console.error(
          `Failed to get chat by id ${chatId} from database`,
          error,
        );
        throw error; // Re-throwing for now, adjust if needed
      }
    },
    ['get-chat-by-id'], // Base key for the cache
    {
      tags: [`chat-${id}`], // Tag for potential revalidation
      revalidate: 3600, // Revalidate cache every hour (adjust as needed)
    },
  );

  // Call the cached function
  return getChatByIdCached(id);
}

export async function saveMessages({
  messages,
}: {
  messages: Array<schema.DBMessage>;
}) {
  try {
    // Perform an upsert operation: Insert new messages, or update existing ones on conflict (based on ID)
    return await db
      .insert(schema.Message_v2)
      .values(messages)
      .onConflictDoUpdate({
        target: schema.Message_v2.id,
        set: {
          role: sql`excluded.role`,
          parts: sql`excluded.parts`,
          attachments: sql`excluded.attachments`,
        },
      });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(schema.Message_v2)
      .where(eq(schema.Message_v2.chatId, id))
      .orderBy(asc(schema.Message_v2.createdAt));
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
      .from(schema.vote)
      .where(and(eq(schema.vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(schema.vote)
        .set({ isUpvoted: type === 'up' })
        .where(
          and(
            eq(schema.vote.messageId, messageId),
            eq(schema.vote.chatId, chatId),
          ),
        );
    }
    return await db.insert(schema.vote).values({
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
    return await db
      .select()
      .from(schema.vote)
      .where(eq(schema.vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export interface SaveDocumentProps {
  id: string;
  title: string;
  content: string;
  kind: ArtifactKind;
  userId: string;
  chatId?: string;
}

export async function saveDocument({
  id,
  title,
  content,
  kind,
  userId,
  chatId,
}: SaveDocumentProps) {
  try {
    // Log the values being inserted
    console.log('Saving document with values:', {
      id,
      title,
      content: content ? `${content.substring(0, 50)}...` : null,
      kind,
      userId,
      chatId,
      createdAt: new Date(),
    });

    const valuesToInsert = {
      id,
      title,
      content,
      kind,
      userId,
      chatId: chatId,
      createdAt: new Date(),
    };

    return await db
      .insert(schema.document)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: schema.document.id,
        set: {
          content,
          title,
          modifiedAt: new Date(),
          chatId: sql`excluded.chat_id`,
        },
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database:', error);
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .orderBy(asc(schema.document.createdAt));

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
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .orderBy(desc(schema.document.createdAt));

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
      .delete(schema.suggestion)
      .where(
        and(
          eq(schema.suggestion.documentId, id),
          gt(schema.suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(schema.document)
      .where(
        and(
          eq(schema.document.id, id),
          gt(schema.document.createdAt, timestamp),
        ),
      );
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
  suggestions: Array<schema.Suggestion>;
}) {
  try {
    return await db.insert(schema.suggestion).values(suggestions);
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
      .from(schema.suggestion)
      .where(and(eq(schema.suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(schema.Message_v2)
      .where(eq(schema.Message_v2.id, id));
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
      .select({ id: schema.Message_v2.id })
      .from(schema.Message_v2)
      .where(
        and(
          eq(schema.Message_v2.chatId, chatId),
          gte(schema.Message_v2.createdAt, timestamp),
        ),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(schema.vote)
        .where(
          and(
            eq(schema.vote.chatId, chatId),
            inArray(schema.vote.messageId, messageIds),
          ),
        );

      return await db
        .delete(schema.Message_v2)
        .where(
          and(
            eq(schema.Message_v2.chatId, chatId),
            inArray(schema.Message_v2.id, messageIds),
          ),
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
  visibility: VisibilityType;
}) {
  try {
    return await db
      .update(schema.Chat)
      .set({ visibility })
      .where(eq(schema.Chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getDocumentsByUserId({
  id,
  limit,
}: {
  id: string;
  limit: number;
}) {
  try {
    // Basic query for now, sort by modifiedAt descending
    const documents = await db
      .select()
      .from(schema.document)
      .where(eq(schema.document.userId, id))
      .orderBy(desc(schema.document.modifiedAt))
      .limit(limit);

    // Simple return for now, no hasMore logic yet
    return {
      documents: documents,
      hasMore: false, // Assume no more for now
    };
  } catch (error) {
    console.error('Failed to get documents by user from database', error);
    throw error;
  }
}
