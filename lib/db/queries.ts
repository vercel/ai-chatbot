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
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
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

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Try to initialize Postgres; if POSTGRES_URL is missing or invalid, we'll use an in-memory fallback in certain functions.
let db: ReturnType<typeof drizzle> | null = null;
const POSTGRES_URL = process.env.POSTGRES_URL;
const isValidPgUrl = (u?: string) =>
  typeof u === "string" && (u.startsWith("postgres://") || u.startsWith("postgresql://"));

try {
  if (!isValidPgUrl(POSTGRES_URL)) throw new Error("POSTGRES_URL invalid or not set");
  const client = postgres(POSTGRES_URL as string);
  db = drizzle(client);
} catch {
  console.warn("Database not configured or invalid POSTGRES_URL. Using in-memory fallback for local dev.");
}

// In-memory fallback store (only used when db === null)
type MemChat = {
  id: string;
  createdAt: Date;
  userId: string;
  title: string;
  visibility: "private" | "public";
  lastContext?: AppUsage;
};

const mem = {
  users: [] as Array<{ id: string; email: string; password?: string | null }>,
  chats: new Map<string, MemChat>(),
  messages: [] as DBMessage[],
  votes: [] as Array<{ chatId: string; messageId: string; isUpvoted: boolean }>,
  documents: [] as Array<{
    id: string;
    title: string;
    kind: ArtifactKind;
    content: string;
    userId: string;
    createdAt: Date;
  }>,
  suggestions: [] as Suggestion[],
  streams: new Map<string, string[]>(),
};

function ensureDb() {
  if (!db) {
    throw new ChatSDKError(
      "offline:database",
      "Database not configured. Provide POSTGRES_URL to enable persistence."
    );
  }
  return db;
}

export async function getUser(email: string): Promise<User[]> {
  if (!db) {
    return mem.users.filter(u => u.email === email) as unknown as User[];
  }
  try {
    const _db = ensureDb();
    return await _db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);
  if (!db) {
    const id = generateUUID();
    mem.users.push({ id, email, password: hashedPassword });
    return [{ id, email }];
  }
  try {
    const _db = ensureDb();
    return await _db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());
  if (!db) {
    const id = generateUUID();
    mem.users.push({ id, email, password });
    return [{ id, email }];
  }
  try {
    const _db = ensureDb();
    return await _db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
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
}) {
  if (!db) {
    mem.chats.set(id, {
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
    return;
  }
  try {
    const _db = ensureDb();
    return await _db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  if (!db) {
    const deleted = mem.chats.get(id) ?? null;
    if (deleted) {
      mem.chats.delete(id);
      mem.messages = mem.messages.filter(m => m.chatId !== id);
      mem.votes = mem.votes.filter(v => v.chatId !== id);
      mem.streams.delete(id);
    }
    return deleted as unknown as Chat;
  }
  try {
    const _db = ensureDb();
    await _db.delete(vote).where(eq(vote.chatId, id));
    await _db.delete(message).where(eq(message.chatId, id));
    await _db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await _db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  if (!db) {
    const chatsToDelete = Array.from(mem.chats.values()).filter(
      c => c.userId === userId
    );
    const chatIds = chatsToDelete.map(c => c.id);
    for (const id of chatIds) {
      mem.chats.delete(id);
      mem.messages = mem.messages.filter(m => m.chatId !== id);
      mem.votes = mem.votes.filter(v => v.chatId !== id);
      mem.streams.delete(id);
    }
    return { deletedCount: chatIds.length };
  }
  try {
    const _db = ensureDb();
    const userChats = await _db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map(c => c.id);

    await _db.delete(vote).where(inArray(vote.chatId, chatIds));
    await _db.delete(message).where(inArray(message.chatId, chatIds));
    await _db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await _db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
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
}) {
  if (!db) {
    const extendedLimit = limit + 1;
    const all = Array.from(mem.chats.values())
      .filter(c => c.userId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let filteredChats: Chat[] = [] as unknown as Chat[];

    if (startingAfter) {
      const selectedChat = mem.chats.get(startingAfter);
      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }
      filteredChats = all.filter(
        c => c.createdAt.getTime() > selectedChat.createdAt.getTime()
      ) as unknown as Chat[];
    } else if (endingBefore) {
      const selectedChat = mem.chats.get(endingBefore);
      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }
      filteredChats = all.filter(
        c => c.createdAt.getTime() < selectedChat.createdAt.getTime()
      ) as unknown as Chat[];
    } else {
      filteredChats = all as unknown as Chat[];
    }

    const hasMore = filteredChats.length > limit;
    return {
      chats: hasMore
        ? (filteredChats.slice(0, limit) as unknown as Chat[])
        : filteredChats,
      hasMore,
    };
  }
  try {
    const _db = ensureDb();
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      _db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await _db
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

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await _db
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

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  if (!db) {
    return (mem.chats.get(id) as unknown as Chat) ?? null;
  }
  try {
    const _db = ensureDb();
    const [selectedChat] = await _db
      .select()
      .from(chat)
      .where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  if (!db) {
    mem.messages.push(...messages);
    return;
  }
  try {
    const _db = ensureDb();
    return await _db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  if (!db) {
    return mem.messages
      .filter(m => m.chatId === id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  try {
    const _db = ensureDb();
    return await _db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
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
}) {
  if (!db) {
    const existing = mem.votes.find(v => v.messageId === messageId);
    if (existing) {
      existing.isUpvoted = type === "up";
      return;
    }
    mem.votes.push({ chatId, messageId, isUpvoted: type === "up" });
    return;
  }
  try {
    const _db = ensureDb();
    const [existingVote] = await _db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await _db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await _db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  if (!db) {
    return mem.votes.filter(v => v.chatId === id) as any;
  }
  try {
    const _db = ensureDb();
    return await _db.select().from(vote).where(eq(vote.chatId, id));
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
}) {
  if (!db) {
    const doc = {
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    };
    mem.documents.push(doc);
    return [doc] as any;
  }
  try {
    const _db = ensureDb();
    return await _db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  if (!db) {
    return mem.documents
      .filter(d => d.id === id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as any;
  }
  try {
    const _db = ensureDb();
    const documents = await _db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  if (!db) {
    const docs = mem.documents
      .filter(d => d.id === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return (docs[0] as any) ?? null;
  }
  try {
    const _db = ensureDb();
    const [selectedDocument] = await _db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  if (!db) {
    const beforeLen = mem.documents.length;
    mem.suggestions = mem.suggestions.filter(
      s => !(s.documentId === id && s.documentCreatedAt > timestamp)
    );
    const deleted = mem.documents.filter(
      d => d.id === id && d.createdAt > timestamp
    );
    mem.documents = mem.documents.filter(
      d => !(d.id === id && d.createdAt > timestamp)
    );
    return deleted as any;
  }
  try {
    const _db = ensureDb();
    await _db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await _db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  if (!db) {
    mem.suggestions.push(...suggestions);
    return;
  }
  try {
    const _db = ensureDb();
    return await _db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  if (!db) {
    return mem.suggestions.filter(s => s.documentId === documentId) as any;
  }
  try {
    const _db = ensureDb();
    return await _db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  if (!db) {
    return mem.messages.filter(m => m.id === id) as any;
  }
  try {
    const _db = ensureDb();
    return await _db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  if (!db) {
    const toDelete = mem.messages.filter(
      m => m.chatId === chatId && m.createdAt >= timestamp
    );
    const ids = new Set(toDelete.map(m => m.id));
    mem.votes = mem.votes.filter(v => !ids.has(v.messageId));
    mem.messages = mem.messages.filter(m => !ids.has(m.id));
    return;
  }
  try {
    const _db = ensureDb();
    const messagesToDelete = await _db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await _db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await _db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  if (!db) {
    const c = mem.chats.get(chatId);
    if (c) c.visibility = visibility;
    return;
  }
  try {
    const _db = ensureDb();
    return await _db
      .update(chat)
      .set({ visibility })
      .where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  if (!db) {
    const c = mem.chats.get(chatId);
    if (c) c.lastContext = context;
    return;
  }
  try {
    const _db = ensureDb();
    return await _db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  if (!db) {
    // In dev with in-memory store, return 0 to avoid rate limiting
    return 0;
  }
  try {
    const _db = ensureDb();
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await _db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  if (!db) {
    const arr = mem.streams.get(chatId) ?? [];
    arr.push(streamId);
    mem.streams.set(chatId, arr);
    return;
  }
  try {
    const _db = ensureDb();
    await _db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  if (!db) {
    return mem.streams.get(chatId) ?? [];
  }
  try {
    const _db = ensureDb();
    const streamIds = await _db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
