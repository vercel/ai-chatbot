/**
 * Database query functions using Drizzle ORM.
 * 
 * All database operations use snake_case column names.
 * Functions are organized by entity (user, chat, message, vote, document, suggestion, stream).
 * 
 * @module lib/db/queries
 */

import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import type { ArtifactKind } from "@/components/artifact/artifact";
import type { VisibilityType } from "@/components/shared/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import {
  resolveTenantContext,
  type ResolveTenantContextOptions,
  type TenantContext,
} from "@/lib/server/tenant/context";
import type { DbClient } from "@/lib/server/tenant/adapters/base";

type QueryOptions = ResolveTenantContextOptions;

async function withTenantDb<T>(
  executor: (db: DbClient, tenant: TenantContext) => Promise<T>,
  options?: QueryOptions
): Promise<T> {
  const tenant = await resolveTenantContext(options);
  const store = await getResourceStore(tenant, {
    connectionId: options?.connectionId ?? tenant.connectionId,
  });

  try {
    return await store.withSqlClient((db) => executor(db, tenant));
  } finally {
    await store.dispose();
  }
}

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

export async function getUser(
  email: string,
  options?: QueryOptions
): Promise<User[]> {
  try {
    return await withTenantDb(
      (db) => db.select().from(user).where(eq(user.email, email)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(
  email: string,
  password: string,
  options?: QueryOptions
) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await withTenantDb(
      (db) =>
        db.insert(user).values({ email, password: hashedPassword }),
      options
    );
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser(options?: QueryOptions) {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await withTenantDb(
      (db) =>
        db.insert(user).values({ email, password }).returning({
          id: user.id,
          email: user.email,
        }),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
},
options?: QueryOptions) {
  try {
    return await withTenantDb(
      (db) =>
        db.insert(chat).values({
          id,
          created_at: new Date(),
          user_id: userId,
          title,
          visibility,
        }),
      options
    );
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      await db.delete(vote).where(eq(vote.chat_id, id));
      await db.delete(message).where(eq(message.chat_id, id));
      await db.delete(stream).where(eq(stream.chat_id, id));

      const [chatsDeleted] = await db
        .delete(chat)
        .where(eq(chat.id, id))
        .returning();
      return chatsDeleted;
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId(
  { userId }: { userId: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      const userChats = await db
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.user_id, userId));

      if (userChats.length === 0) {
        return { deletedCount: 0 };
      }

      const chatIds = userChats.map((c) => c.id);

      await db.delete(vote).where(inArray(vote.chat_id, chatIds));
      await db.delete(message).where(inArray(message.chat_id, chatIds));
      await db.delete(stream).where(inArray(stream.chat_id, chatIds));

      const deletedChats = await db
        .delete(chat)
        .where(eq(chat.user_id, userId))
        .returning();

      return { deletedCount: deletedChats.length };
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
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
},
options?: QueryOptions) {
  try {
    return await withTenantDb(async (db) => {
      const extendedLimit = limit + 1;

      const baseQuery = (whereCondition?: SQL<any>) =>
        db
          .select()
          .from(chat)
          .where(
            whereCondition
              ? and(whereCondition, eq(chat.user_id, id))
              : eq(chat.user_id, id)
          )
          .orderBy(desc(chat.created_at))
          .limit(extendedLimit);

      let filteredChats: Chat[] = [];

      if (startingAfter) {
        const [selectedChat] = await db
          .select()
          .from(chat)
          .where(eq(chat.id, startingAfter))
          .limit(1);

        if (!selectedChat) {
          throw new ChatSDKError(
            "not_found:database",
            `Chat with id ${startingAfter} not found`
          );
        }

        filteredChats = await baseQuery(
          lt(chat.created_at, selectedChat.created_at)
        );
      } else if (endingBefore) {
        const [selectedChat] = await db
          .select()
          .from(chat)
          .where(eq(chat.id, endingBefore))
          .limit(1);

        if (!selectedChat) {
          throw new ChatSDKError(
            "not_found:database",
            `Chat with id ${endingBefore} not found`
          );
        }

        filteredChats = await baseQuery(
          gt(chat.created_at, selectedChat.created_at)
        );
      } else {
        filteredChats = await baseQuery();
      }

      const hasMore = filteredChats.length > limit;

      return {
        chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
        hasMore,
      };
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, id));
      if (!selectedChat) {
        return null;
      }

      return selectedChat;
    }, options);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages(
  { messages }: { messages: DBMessage[] },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) => db.insert(message).values(messages),
      options
    );
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) =>
        db
          .select()
          .from(message)
          .where(eq(message.chat_id, id))
          .orderBy(asc(message.created_at)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
},
options?: QueryOptions) {
  try {
    return await withTenantDb(async (db) => {
      const [existingVote] = await db
        .select()
        .from(vote)
        .where(and(eq(vote.message_id, messageId)));

      if (existingVote) {
        return db
          .update(vote)
          .set({ is_upvoted: type === "up" })
          .where(
            and(eq(vote.message_id, messageId), eq(vote.chat_id, chatId))
          );
      }

      return db.insert(vote).values({
        chat_id: chatId,
        message_id: messageId,
        is_upvoted: type === "up",
      });
    }, options);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) => db.select().from(vote).where(eq(vote.chat_id, id)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
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
},
options?: QueryOptions) {
  try {
    return await withTenantDb(
      (db) =>
        db
          .insert(document)
          .values({
            id,
            title,
            kind,
            content,
            user_id: userId,
            created_at: new Date(),
          })
          .returning(),
      options
    );
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) =>
        db
          .select()
          .from(document)
          .where(eq(document.id, id))
          .orderBy(asc(document.created_at)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      async (db) => {
        const [selectedDocument] = await db
          .select()
          .from(document)
          .where(eq(document.id, id))
          .orderBy(desc(document.created_at));

        return selectedDocument ?? null;
      },
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp(
  {
    id,
    timestamp,
  }: {
    id: string;
    timestamp: Date;
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      await db
        .delete(suggestion)
        .where(
          and(
            eq(suggestion.document_id, id),
            gt(suggestion.document_created_at, timestamp)
          )
        );

      return db
        .delete(document)
        .where(and(eq(document.id, id), gt(document.created_at, timestamp)))
        .returning();
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions(
  {
    suggestions,
  }: {
    suggestions: Suggestion[];
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) => db.insert(suggestion).values(suggestions),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId(
  {
    documentId,
  }: {
    documentId: string;
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) =>
        db
          .select()
          .from(suggestion)
          .where(eq(suggestion.document_id, documentId)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById(
  { id }: { id: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) => db.select().from(message).where(eq(message.id, id)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp(
  {
    chatId,
    timestamp,
  }: {
    chatId: string;
    timestamp: Date;
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      const messagesToDelete = await db
        .select({ id: message.id })
        .from(message)
        .where(
          and(eq(message.chat_id, chatId), gte(message.created_at, timestamp))
        );

      const messageIds = messagesToDelete.map(
        (currentMessage) => currentMessage.id
      );

      if (messageIds.length === 0) {
        return [];
      }

      await db
        .delete(vote)
        .where(
          and(eq(vote.chat_id, chatId), inArray(vote.message_id, messageIds))
        );

      return db
        .delete(message)
        .where(
          and(eq(message.chat_id, chatId), inArray(message.id, messageIds))
        );
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById(
  {
    chatId,
    visibility,
  }: {
    chatId: string;
    visibility: "private" | "public";
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) => db.update(chat).set({ visibility }).where(eq(chat.id, chatId)),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById(
  {
    chatId,
    context,
  }: {
    chatId: string;
    // Store merged server-enriched usage object
    context: AppUsage;
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(
      (db) =>
        db
          .update(chat)
          .set({ last_context: context })
          .where(eq(chat.id, chatId)),
      options
    );
  } catch (error) {
    console.warn("Failed to update last_context for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId(
  {
    id,
    differenceInHours,
  }: {
    id: string;
    differenceInHours: number;
  },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      const twentyFourHoursAgo = new Date(
        Date.now() - differenceInHours * 60 * 60 * 1000
      );

      const [stats] = await db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chat_id, chat.id))
        .where(
          and(
            eq(chat.user_id, id),
            gte(message.created_at, twentyFourHoursAgo),
            eq(message.role, "user")
          )
        )
        .execute();

      return stats?.count ?? 0;
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId(
  {
    streamId,
    chatId,
  }: {
    streamId: string;
    chatId: string;
  },
  options?: QueryOptions
) {
  try {
    await withTenantDb(
      (db) =>
        db
          .insert(stream)
          .values({ id: streamId, chat_id: chatId, created_at: new Date() }),
      options
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId(
  { chatId }: { chatId: string },
  options?: QueryOptions
) {
  try {
    return await withTenantDb(async (db) => {
      const streamIds = await db
        .select({ id: stream.id })
        .from(stream)
        .where(eq(stream.chat_id, chatId))
        .orderBy(asc(stream.created_at))
        .execute();

      return streamIds.map(({ id }) => id);
    }, options);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
