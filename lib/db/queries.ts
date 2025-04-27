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
import type { JSONContent } from '@tiptap/react';

import * as schema from './schema';
import type { ArtifactKind } from '@/components/artifact';
import type { VisibilityType } from '@/components/visibility-selector';

// Inferred types based on current schema
export type NewDBMessage = typeof schema.Message_v2.$inferInsert;
export type NewDBDocument = typeof schema.document.$inferInsert;

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
    console.error('Failed to save chat in database', {
      error,
      chatId: id,
      userId,
    });
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(schema.vote).where(eq(schema.vote.chatId, id));
    await db.delete(schema.Message_v2).where(eq(schema.Message_v2.chatId, id));

    return await db.delete(schema.Chat).where(eq(schema.Chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database', {
      error,
      chatId: id,
    });
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
    console.error('Failed to get chats by user from database', { error });
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  const getChatByIdCached = unstable_cache(
    async (chatId: string) => {
      console.log(`Cache miss: Fetching chat ${chatId} from DB`);
      console.time(`getChatById DB Query - Chat ${chatId}`);
      try {
        const [selectedChat] = await db
          .select()
          .from(schema.Chat)
          .where(eq(schema.Chat.id, chatId));
        console.timeEnd(`getChatById DB Query - Chat ${chatId}`);
        return selectedChat;
      } catch (error) {
        console.timeEnd(`getChatById DB Query - Chat ${chatId}`);
        console.error(`Failed to get chat by id ${chatId} from database`, {
          error,
          chatId,
        });
        throw error;
      }
    },
    ['get-chat-by-id'],
    {
      tags: [`chat-${id}`],
      revalidate: 3600,
    },
  );

  return getChatByIdCached(id);
}

// Version closer to original Vercel repo structure
export async function saveMessages({
  messages,
}: {
  messages: NewDBMessage[]; // Use the inferred insert type array
}): Promise<void> {
  if (!messages?.length) return;

  // Minimal preparation: Ensure JSON is stringified (original didn't explicitly do this)
  // And handle optional client-side IDs (original didn't explicitly do this)
  const preparedMessages = messages.map((msg) => {
    const messageToSave: any = { ...msg }; // Create shallow copy to modify

    // Stringify parts if needed
    if (messageToSave.parts && typeof messageToSave.parts !== 'string') {
      try {
        messageToSave.parts = JSON.stringify(messageToSave.parts);
      } catch (e) {
        console.error('Error stringifying message parts', {
          error: e,
          messageId: msg.id,
        });
        messageToSave.parts = '[]'; // Default on error
      }
    }

    // Stringify attachments if needed
    if (
      messageToSave.attachments &&
      typeof messageToSave.attachments !== 'string'
    ) {
      try {
        messageToSave.attachments = JSON.stringify(messageToSave.attachments);
      } catch (e) {
        console.error('Error stringifying message attachments', {
          error: e,
          messageId: msg.id,
        });
        messageToSave.attachments = '[]'; // Default on error
      }
    }

    // Omit client-side ID if present (let DB generate)
    if (
      typeof messageToSave.id === 'string' &&
      messageToSave.id.startsWith('msg-')
    ) {
      console.log('Omitting client-side message ID for DB generation.', {
        messageId: messageToSave.id,
      });
      // Use object destructuring to omit id
      const { id, ...rest } = messageToSave;
      return rest as NewDBMessage;
    } else if (messageToSave.id === null || messageToSave.id === undefined) {
      console.log('Message ID is null/undefined, allowing DB generation.');
      const { id, ...rest } = messageToSave;
      return rest as NewDBMessage;
    }

    // Keep existing ID if it's not a client-side one
    return messageToSave as NewDBMessage;
  });

  console.log('Attempting to save messages', {
    count: preparedMessages.length,
    chatId: preparedMessages[0]?.chatId,
  });

  try {
    // Use preparedMessages. Using onConflictDoNothing as a safety measure.
    await db
      .insert(schema.Message_v2)
      .values(preparedMessages)
      .onConflictDoNothing();
    console.log('Saved messages result (inserted or skipped on conflict)');
    // Returning the result might not be standard, original just inserted.
    // To get saved messages back, you might need .returning() if supported and desired.
  } catch (error) {
    console.error('Failed to save messages in database', {
      error,
      firstMessage: preparedMessages[0],
    });
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
    console.error('Failed to get messages by chat id from database', { error });
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
    console.error('Failed to upvote message in database', { error });
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
    console.error('Failed to get votes by chat id from database', { error });
    throw error;
  }
}

// Version closer to original Vercel repo, adapted for current schema and upsert
export async function saveDocument(
  doc: NewDBDocument,
): Promise<{ id: string } | null> {
  // Add console.log here to inspect the input
  console.log('saveDocument received doc:', JSON.stringify(doc, null, 2));

  if (!doc.id) {
    console.error('saveDocument called without document ID');
    throw new Error('Document ID is required to save a document');
  }
  if (!doc.userId) {
    console.error('saveDocument called without userId', { documentId: doc.id });
    throw new Error('User ID is required to save a document');
  }
  if (!doc.title && !doc.content && !doc.content_json) {
    console.warn('Attempting to save document with no title or content', {
      documentId: doc.id,
    });
    // Allow saving empty for now, maybe change later
  }

  // Prepare the document for saving/updating
  const documentToSave: NewDBDocument = {
    ...doc,
    // Ensure fields expected by schema exist, even if null
    content: doc.content ?? null,
    content_json: doc.content_json ?? null,
    chatId: doc.chatId ?? null,
    tags: doc.tags ?? [], // Default to empty array if undefined
    createdAt: doc.createdAt || new Date(), // Use provided or set new
    modifiedAt: new Date(), // Always update modified time on save/update
  };

  console.log('Attempting to save/update document', {
    documentId: doc.id,
    userId: doc.userId,
  });

  try {
    // Use onConflictDoUpdate for upsert behavior (deviation from original simple insert)
    const result = await db
      .insert(schema.document) // Use the correct schema table
      .values(documentToSave)
      .onConflictDoUpdate({
        target: [schema.document.id], // Conflict on the primary key 'id'
        set: {
          // Specify columns to update on conflict
          title: documentToSave.title,
          content: documentToSave.content,
          content_json: documentToSave.content_json,
          kind: documentToSave.kind,
          tags: documentToSave.tags,
          modifiedAt: documentToSave.modifiedAt, // Update modified time
          // Do NOT update id, userId, createdAt, chatId on conflict
        },
      })
      .returning({ id: schema.document.id }); // Return the ID of the inserted/updated row

    if (result && result.length > 0) {
      console.log('Successfully saved/updated document', {
        documentId: result[0].id,
        userId: doc.userId,
      });
      return result[0]; // Return { id: ... }
    } else {
      console.warn('Document save/update did not return expected ID.', {
        documentId: doc.id,
      });
      return null;
    }
  } catch (error) {
    console.error('Error saving/updating document in database', {
      error,
      documentId: doc.id,
      userId: doc.userId,
    });
    throw error; // Re-throw the error
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(schema.document) // Correct schema reference
      .where(eq(schema.document.id, id))
      .orderBy(asc(schema.document.createdAt));
    return documents;
  } catch (error) {
    console.error('Failed to get documents by id from database', {
      error,
      documentId: id,
    });
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(schema.document) // Correct schema reference
      .where(eq(schema.document.id, id))
      .orderBy(desc(schema.document.createdAt)); // Get the latest by creation time
    return selectedDocument;
  } catch (error) {
    console.error('Failed to get latest document by id from database', {
      error,
      documentId: id,
    });
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
      { error },
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
    console.error('Failed to save suggestions in database', { error });
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
      { error },
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const result = await db
      .select()
      .from(schema.Message_v2)
      .where(eq(schema.Message_v2.id, id));
    return result[0];
  } catch (error) {
    console.error('Failed to get message by id from database', {
      error,
      messageId: id,
    });
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
      { error },
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
    console.error('Failed to update chat visibility in database', { error });
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
    console.error('Failed to get documents by user from database', { error });
    throw error;
  }
}
