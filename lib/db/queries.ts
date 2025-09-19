import 'server-only';

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
  or,
  ilike,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  agent,
  userAgent,
  type Agent,
  agentVectorStoreFile,
  type AgentVectorStoreFile,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import type { LanguageModelV2Usage } from '@ai-sdk/provider';

// Database queries for user management and WorkOS integration

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

// New function to sync WorkOS users with our database
export async function findOrCreateUserFromWorkOS(workosUser: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<User> {
  try {
    // First, try to find user by email
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, workosUser.email));

    if (existingUsers.length > 0) {
      // User exists, return the first one
      return existingUsers[0];
    }

    // User doesn't exist, create a new one
    // We'll store the WorkOS user ID in the email field temporarily
    // until we can add a proper workos_user_id field to the schema
    const newUser = await db
      .insert(user)
      .values({
        email: workosUser.email,
        // Store a hashed placeholder password since this field is required
        // but won't be used for WorkOS authentication
        password: generateHashedPassword(`workos-${workosUser.id}`),
      })
      .returning();

    if (newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    return newUser[0];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to find or create user from WorkOS data',
    );
  }
}

// New function to get database user from WorkOS user
export async function getDatabaseUserFromWorkOS(workosUser: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<User | null> {
  try {
    // Find user by email (our current mapping strategy)
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, workosUser.email));

    if (users.length === 0) {
      // User doesn't exist in database yet, create them
      return await findOrCreateUserFromWorkOS(workosUser);
    }

    return users[0];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get database user from WorkOS user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  agentId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  agentId?: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      agentId,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
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
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
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
  } catch (error) {
    console.error('getChatsByUserId failed', {
      userId: id,
      startingAfter,
      endingBefore,
      error,
    });
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function getChatWithAgent(chatId: string, userId: string) {
  try {
    const result = await db
      .select({
        chat: chat,
        agent: agent,
      })
      .from(chat)
      .leftJoin(agent, eq(chat.agentId, agent.id))
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chat with agent',
    );
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
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
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
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
  try {
    return await db
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
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
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
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store raw LanguageModelUsage to keep it simple
  context: LanguageModelV2Usage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn('Failed to update lastContext for chat', chatId, error);
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
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
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
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Agents

export async function getUserOwnedAgents({
  userId,
  limit = 20,
  offset = 0,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<{
  data: Array<{ agent: Agent; user: User | null }>;
  total: number;
}> {
  try {
    const where = eq(agent.userId, userId);

    const [countRow] = await db
      .select({ count: count(agent.id) })
      .from(agent)
      .where(where);

    const rows = await db
      .select({ agent, user })
      .from(agent)
      .leftJoin(user, eq(agent.userId, user.id))
      .where(where)
      .orderBy(desc(agent.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total: countRow?.count ?? 0 };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list user owned agents',
    );
  }
}

export async function getPublicAgents({
  q,
  limit = 20,
  offset = 0,
}: {
  q?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{
  data: Array<{ agent: Agent; user: User | null }>;
  total: number;
}> {
  try {
    const whereBase = eq(agent.isPublic, true);
    const where = q
      ? and(
          whereBase,
          or(
            ilike(agent.name, `%${q}%`),
            ilike(agent.description, `%${q}%`),
            ilike(agent.slug, `%${q}%`),
          ),
        )
      : whereBase;

    const [countRow] = await db
      .select({ count: count(agent.id) })
      .from(agent)
      .where(where);

    const rows = await db
      .select({ agent, user })
      .from(agent)
      .leftJoin(user, eq(agent.userId, user.id))
      .where(where)
      .orderBy(desc(agent.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total: countRow?.count ?? 0 };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to list agents');
  }
}

export async function getAgentBySlug({ slug }: { slug: string }) {
  try {
    const [row] = await db.select().from(agent).where(eq(agent.slug, slug));
    return row ?? null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get agent');
  }
}

export async function getAgentWithUserState({
  slug,
  userId,
}: {
  slug: string;
  userId: string;
}) {
  try {
    const rows = await db
      .select({
        agent,
        savedUserId: userAgent.userId,
      })
      .from(agent)
      .leftJoin(
        userAgent,
        and(eq(userAgent.agentId, agent.id), eq(userAgent.userId, userId)),
      )
      .where(eq(agent.slug, slug))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      agent: row.agent as Agent,
      saved: Boolean(row.savedUserId),
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get agent with user state',
    );
  }
}

export async function getVectorStoreFilesByUser({
  userId,
  vectorStoreId,
}: {
  userId: string;
  vectorStoreId: string;
}): Promise<Array<AgentVectorStoreFile>> {
  try {
    return await db
      .select()
      .from(agentVectorStoreFile)
      .where(
        and(
          eq(agentVectorStoreFile.userId, userId),
          eq(agentVectorStoreFile.vectorStoreId, vectorStoreId),
        ),
      )
      .orderBy(asc(agentVectorStoreFile.fileName));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to load vector store files',
    );
  }
}

export async function getVectorStoreFileForUser({
  userId,
  vectorStoreId,
  vectorStoreFileId,
}: {
  userId: string;
  vectorStoreId: string;
  vectorStoreFileId: string;
}): Promise<AgentVectorStoreFile | null> {
  try {
    const rows = await db
      .select()
      .from(agentVectorStoreFile)
      .where(
        and(
          eq(agentVectorStoreFile.userId, userId),
          eq(agentVectorStoreFile.vectorStoreId, vectorStoreId),
          eq(agentVectorStoreFile.vectorStoreFileId, vectorStoreFileId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to load vector store file metadata',
    );
  }
}

export async function assignAgentVectorStoreFiles({
  userId,
  agentId,
  vectorStoreId,
}: {
  userId: string;
  agentId: string;
  vectorStoreId: string;
}) {
  try {
    await db
      .update(agentVectorStoreFile)
      .set({ agentId, updatedAt: new Date() })
      .where(
        and(
          eq(agentVectorStoreFile.userId, userId),
          eq(agentVectorStoreFile.vectorStoreId, vectorStoreId),
        ),
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to link vector store files to agent',
    );
  }
}

export async function saveAgentForUser({
  agentId,
  userId,
}: {
  agentId: string;
  userId: string;
}) {
  try {
    // Upsert to be idempotent
    return await db
      .insert(userAgent)
      .values({ userId, agentId, createdAt: new Date(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userAgent.userId, userAgent.agentId],
        set: { updatedAt: new Date() },
      });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save agent for user',
    );
  }
}

export async function unsaveAgentForUser({
  agentId,
  userId,
}: {
  agentId: string;
  userId: string;
}) {
  try {
    return await db
      .delete(userAgent)
      .where(and(eq(userAgent.userId, userId), eq(userAgent.agentId, agentId)))
      .execute();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to unsave agent for user',
    );
  }
}

export async function getSavedAgentsByUserId({
  userId,
  limit = 50,
  offset = 0,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const rows = await db
      .select({ agent })
      .from(userAgent)
      .innerJoin(agent, eq(agent.id, userAgent.agentId))
      .where(eq(userAgent.userId, userId))
      .orderBy(desc(userAgent.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({ agent: r.agent as Agent }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list saved agents',
    );
  }
}
