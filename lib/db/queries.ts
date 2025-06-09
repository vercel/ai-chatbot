/**
 * @file lib/db/queries.ts
 * @description Функции для выполнения запросов к базе данных.
 * @version 1.11.0
 * @date 2025-06-09
 * @updated Удалены функции `createStreamId` и `getStreamIdsByChatId` после отказа от кастомной реализации возобновляемых стримов.
 */

/** HISTORY:
 * v1.11.0 (2025-06-09): Удалены неиспользуемые функции для работы со стримами.
 * v1.10.1 (2025-06-09): Удалены неиспользуемые функции для работы со стримами.
 * v1.10.0 (2025-06-09): Внедрена система структурированного логирования.
 */

import 'server-only'

import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lt, sql, type SQL, } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createLogger } from '@fab33/sys-logger'

import {
  chat,
  type Chat,
  type DBMessage,
  document,
  type Document as DBDocument,
  message,
  type Suggestion,
  suggestion,
  user,
  type User,
} from './schema'
import type { ArtifactKind } from '@/components/artifact'
import { generateUUID } from '../utils'
import { generateHashedPassword } from './utils'
import type { VisibilityType } from '@/lib/types'
import { ChatSDKError } from '../errors'
import { generateAndSaveSummary } from '../ai/summarizer'

const logger = createLogger('lib:db:queries');

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})
export const db = drizzle(client)

export async function getUser (email: string): Promise<Array<User>> {
  logger.trace({ email }, 'Entering getUser');
  try {
    const result = await db.select().from(user).where(eq(user.email, email));
    logger.trace({ result }, 'Exiting getUser');
    return result;
  } catch (error) {
    logger.error({ email, err: error as Error }, 'Failed to get user by email');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    )
  }
}

export async function createUser (email: string, password: string) {
  logger.trace({ email }, 'Entering createUser');
  const hashedPassword = generateHashedPassword(password);
  try {
    const result = await db.insert(user).values({ email, password: hashedPassword });
    logger.trace('Exiting createUser');
    return result;
  } catch (error) {
    logger.error({ email, err: error as Error }, 'Failed to create user');
    throw new ChatSDKError('bad_request:database', 'Failed to create user')
  }
}

export async function createGuestUser () {
  logger.trace('Entering createGuestUser');
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const result = await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
    logger.info({ userId: result[0]?.id }, 'Guest user created');
    logger.trace({ result }, 'Exiting createGuestUser');
    return result;
  } catch (error) {
    logger.error({ err: error as Error }, 'Failed to create guest user');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    )
  }
}

export async function saveChat ({
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
  const childLogger = logger.child({ chatId: id, userId });
  childLogger.trace({ title, visibility }, 'Entering saveChat');
  try {
    const result = await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    }).onConflictDoNothing();
    childLogger.info('Chat saved successfully');
    childLogger.trace({ result }, 'Exiting saveChat');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to save chat');
    throw new ChatSDKError('bad_request:database', 'Failed to save chat')
  }
}

export async function deleteChatById ({ id }: { id: string }) {
  const childLogger = logger.child({ chatId: id });
  childLogger.trace('Entering deleteChatById');
  try {
    await db.delete(message).where(eq(message.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();

    childLogger.info('Chat deleted successfully');
    childLogger.trace({ chatsDeleted }, 'Exiting deleteChatById');
    return chatsDeleted;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to delete chat by id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    )
  }
}

export async function getChatsByUserId ({
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
  const childLogger = logger.child({ userId: id, limit, startingAfter, endingBefore });
  childLogger.trace('Entering getChatsByUserId');
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
      childLogger.debug('Paginating forward');
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        childLogger.warn('Chat for starting_after not found');
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        )
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      childLogger.debug('Paginating backward');
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        childLogger.warn('Chat for ending_before not found');
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        )
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      childLogger.debug('Fetching first page');
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;
    const result = {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
    childLogger.trace({ result }, 'Exiting getChatsByUserId');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get chats by user id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    )
  }
}

export async function getChatById ({ id }: { id: string }) {
  const childLogger = logger.child({ chatId: id });
  childLogger.trace('Entering getChatById');
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    childLogger.trace({ selectedChat }, 'Exiting getChatById');
    return selectedChat;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get chat by id');
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages ({
  messages: messagesToSave,
}: {
  messages: Array<DBMessage>;
}) {
  const childLogger = logger.child({ messagesCount: messagesToSave.length });
  childLogger.trace('Entering saveMessages');
  try {
    const result = await db.insert(message).values(messagesToSave);
    childLogger.info('Messages saved successfully');
    childLogger.trace({ result }, 'Exiting saveMessages');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to save messages');
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId ({ id }: { id: string }) {
  const childLogger = logger.child({ chatId: id });
  childLogger.trace('Entering getMessagesByChatId');
  try {
    const result = await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
    childLogger.trace({ messagesCount: result.length }, 'Exiting getMessagesByChatId');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get messages by chat id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    )
  }
}

export async function saveDocument ({
  id,
  title,
  kind,
  content,
  userId,
  authorId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  authorId: string | null;
}) {
  const childLogger = logger.child({ documentId: id, userId, kind });
  childLogger.trace({ title, authorId }, 'Entering saveDocument');
  try {
    const [savedDocument] = await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        authorId,
        createdAt: new Date(),
      })
      .returning();

    childLogger.info('Document saved successfully');

    if (savedDocument && savedDocument.content) {
      childLogger.debug('Scheduling summary generation');
      generateAndSaveSummary(id, savedDocument.content, kind).catch(err => {
        childLogger.error({ err }, 'Async summary generation failed');
      });
    }

    childLogger.trace({ savedDocument }, 'Exiting saveDocument');
    return [savedDocument];

  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to save document');
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById ({ id }: { id: string }): Promise<Array<DBDocument>> {
  const childLogger = logger.child({ documentId: id });
  childLogger.trace('Entering getDocumentsById');
  try {
    const documentsResult = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
    childLogger.trace({ versionsCount: documentsResult.length }, 'Exiting getDocumentsById');
    return documentsResult;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get documents by id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    )
  }
}

export async function getDocumentById ({ id, version }: { id: string; version?: number | null }): Promise<{
  doc: DBDocument,
  totalVersions: number
} | undefined> {
  const childLogger = logger.child({ documentId: id, version });
  childLogger.trace('Entering getDocumentById');
  try {
    const allVersions = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    if (allVersions.length === 0) {
      childLogger.warn('Document not found');
      return undefined;
    }

    const totalVersions = allVersions.length;
    let selectedDocument: DBDocument;

    if (version != null && version > 0 && version <= totalVersions) {
      // Версия 1-индексированная
      selectedDocument = allVersions[version - 1];
    } else {
      // Последняя версия по умолчанию
      selectedDocument = allVersions[totalVersions - 1];
    }

    const result = { doc: selectedDocument, totalVersions };
    childLogger.trace({ result }, 'Exiting getDocumentById');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get document by id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    )
  }
}

export async function deleteDocumentsByIdAfterTimestamp ({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const childLogger = logger.child({ documentId: id, timestamp });
  childLogger.trace('Entering deleteDocumentsByIdAfterTimestamp');
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      )

    const result = await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();

    childLogger.info(`${result.length} document versions deleted`);
    childLogger.trace({ result }, 'Exiting deleteDocumentsByIdAfterTimestamp');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to delete documents by id after timestamp');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    )
  }
}

export async function saveSuggestions ({
  suggestions: suggestionsToSave,
}: {
  suggestions: Array<Suggestion>;
}) {
  const childLogger = logger.child({ suggestionsCount: suggestionsToSave.length });
  childLogger.trace('Entering saveSuggestions');
  try {
    const result = await db.insert(suggestion).values(suggestionsToSave);
    childLogger.info('Suggestions saved successfully');
    childLogger.trace({ result }, 'Exiting saveSuggestions');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to save suggestions');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    )
  }
}

export async function getSuggestionsByDocumentId ({
  documentId,
}: {
  documentId: string;
}) {
  const childLogger = logger.child({ documentId });
  childLogger.trace('Entering getSuggestionsByDocumentId');
  try {
    const result = await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
    childLogger.trace({ suggestionsCount: result.length }, 'Exiting getSuggestionsByDocumentId');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get suggestions by document id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    )
  }
}

export async function getMessageById ({ id }: { id: string }): Promise<DBMessage | undefined> {
  const childLogger = logger.child({ messageId: id });
  childLogger.trace('Entering getMessageById');
  try {
    const [result] = await db.select().from(message).where(eq(message.id, id));
    childLogger.trace({ result }, 'Exiting getMessageById');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get message by id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    )
  }
}

export async function deleteMessageById ({ messageId }: { messageId: string }): Promise<DBMessage | undefined> {
  const childLogger = logger.child({ messageId });
  childLogger.trace('Entering deleteMessageById');
  try {
    const [deletedMessage] = await db.delete(message).where(eq(message.id, messageId)).returning();
    childLogger.info('Message deleted successfully');
    childLogger.trace({ deletedMessage }, 'Exiting deleteMessageById');
    return deletedMessage;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to delete message by id');
    throw new ChatSDKError('bad_request:database', 'Failed to delete message');
  }
}

export async function getMessageWithSiblings ({ messageId }: { messageId: string }) {
  const childLogger = logger.child({ messageId });
  childLogger.trace('Entering getMessageWithSiblings');
  const targetMessage = await getMessageById({ id: messageId });
  if (!targetMessage) {
    childLogger.warn('Target message not found');
    return null;
  }

  const allMessages = await getMessagesByChatId({ id: targetMessage.chatId });
  const targetIndex = allMessages.findIndex(m => m.id === messageId);

  if (targetIndex === -1) {
    childLogger.warn('Target message not found in chat history');
    return null;
  }

  const result = {
    previous: targetIndex > 0 ? allMessages[targetIndex - 1] : undefined,
    current: targetMessage,
    next: targetIndex < allMessages.length - 1 ? allMessages[targetIndex + 1] : undefined,
    all: allMessages,
  };
  childLogger.trace({ ...result, all: `[${result.all.length} messages]` }, 'Exiting getMessageWithSiblings');
  return result;
}

export async function deleteMessagesByChatIdAfterTimestamp ({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const childLogger = logger.child({ chatId, timestamp });
  childLogger.trace('Entering deleteMessagesByChatIdAfterTimestamp');
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((msg) => msg.id);

    if (messageIds.length > 0) {
      childLogger.info(`Deleting ${messageIds.length} messages`);
      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to delete messages by chat id after timestamp');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    )
  }
}

export async function updateChatVisiblityById ({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const childLogger = logger.child({ chatId, visibility });
  childLogger.trace('Entering updateChatVisiblityById');
  try {
    const result = await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
    childLogger.info('Chat visibility updated');
    childLogger.trace({ result }, 'Exiting updateChatVisiblityById');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to update chat visibility by id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    )
  }
}

export async function getMessageCountByUserId ({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  const childLogger = logger.child({ userId: id, differenceInHours });
  childLogger.trace('Entering getMessageCountByUserId');
  try {
    const targetDate = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, targetDate),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    const result = stats?.count ?? 0;
    childLogger.trace({ result }, 'Exiting getMessageCountByUserId');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get message count by user id');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    )
  }
}

export async function getRecentContentByUserId ({
  userId,
  limit = 5,
  kind,
}: {
  userId: string;
  limit?: number;
  kind?: ArtifactKind;
}): Promise<Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content' | 'summary'>[]> {
  const childLogger = logger.child({ userId, limit, kind });
  childLogger.trace('Entering getRecentContentByUserId');
  try {
    const rn = sql<number>`row_number
    () OVER (PARTITION BY
    ${document.id}
    ORDER
    BY
    ${document.createdAt}
    DESC
    )`.as('rn')

    const latestVersionsSubquery = db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        summary: document.summary,
        kind: document.kind,
        createdAt: document.createdAt,
        userId: document.userId,
        rn: rn,
      })
      .from(document)
      .as('latest_versions')

    const whereConditions = [
      eq(latestVersionsSubquery.rn, 1),
      eq(latestVersionsSubquery.userId, userId),
    ]
    if (kind) {
      whereConditions.push(eq(latestVersionsSubquery.kind, kind))
    }

    const documentsResult = await db
      .select({
        id: latestVersionsSubquery.id,
        title: latestVersionsSubquery.title,
        createdAt: latestVersionsSubquery.createdAt,
        kind: latestVersionsSubquery.kind,
        content: latestVersionsSubquery.content,
        summary: latestVersionsSubquery.summary,
      })
      .from(latestVersionsSubquery)
      .where(and(...whereConditions))
      .orderBy(desc(latestVersionsSubquery.createdAt))
      .limit(limit)

    childLogger.trace({ documentsCount: documentsResult.length }, 'Exiting getRecentContentByUserId');
    return documentsResult;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get recent content for user');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get recent content',
    )
  }
}

export async function getPagedContentByUserId ({
  userId,
  page = 1,
  pageSize = 10,
  searchQuery,
  kind
}: {
  userId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: ArtifactKind;
}): Promise<{ data: Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'>[], totalCount: number }> {
  const childLogger = logger.child({ userId, page, pageSize, searchQuery, kind });
  childLogger.trace('Entering getPagedContentByUserId');
  try {
    const offset = (page - 1) * pageSize
    const rn = sql<number>`row_number
    () OVER (PARTITION BY
    ${document.id}
    ORDER
    BY
    ${document.createdAt}
    DESC
    )`.as('rn')

    const baseWhereConditions: (SQL | undefined)[] = [
      eq(document.userId, userId),
      searchQuery ? ilike(document.title, `%${searchQuery}%`) : undefined,
      kind ? eq(document.kind, kind) : undefined,
    ].filter(Boolean)

    const latestVersionsSubquery = db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        summary: document.summary,
        kind: document.kind,
        createdAt: document.createdAt,
        userId: document.userId,
        rn: rn,
      })
      .from(document)
      .where(and(...baseWhereConditions))
      .as('latest_versions')

    const dataQuery = db
      .select({
        id: latestVersionsSubquery.id,
        title: latestVersionsSubquery.title,
        createdAt: latestVersionsSubquery.createdAt,
        content: latestVersionsSubquery.content,
        kind: latestVersionsSubquery.kind,
        summary: latestVersionsSubquery.summary,
      })
      .from(latestVersionsSubquery)
      .where(eq(latestVersionsSubquery.rn, 1))
      .orderBy(desc(latestVersionsSubquery.createdAt))
      .limit(pageSize)
      .offset(offset)

    const totalCountResult = await db
      .select({ count: count() })
      .from(latestVersionsSubquery)
      .where(eq(latestVersionsSubquery.rn, 1))

    const data = await dataQuery

    const result = {
      data,
      totalCount: totalCountResult[0]?.count ?? 0,
    };

    childLogger.trace({ dataCount: result.data.length, totalCount: result.totalCount }, 'Exiting getPagedContentByUserId');
    return result;

  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to get paged content for user');
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get paged content',
    )
  }
}

export async function deleteDocumentCompletelyById ({
  documentId,
  userId,
}: {
  documentId: string;
  userId: string;
}): Promise<{ deletedSuggestionsCount: number; deletedDocumentVersionsCount: number }> {
  const childLogger = logger.child({ documentId, userId });
  childLogger.trace('Entering deleteDocumentCompletelyById');
  try {
    const userDocuments = await db
      .select({ id: document.id })
      .from(document)
      .where(and(eq(document.id, documentId), eq(document.userId, userId)))
      .limit(1)

    if (userDocuments.length === 0) {
      childLogger.warn('Document not found or access denied for deletion');
      throw new ChatSDKError(
        'forbidden:database',
        'Document not found or access denied.',
      )
    }

    const deletedSuggestionsResult = await db
      .delete(suggestion)
      .where(eq(suggestion.documentId, documentId))
      .returning({ id: suggestion.id })

    const deletedDocumentsResult = await db
      .delete(document)
      .where(eq(document.id, documentId))
      .returning({ id: document.id, createdAt: document.createdAt })

    const result = {
      deletedSuggestionsCount: deletedSuggestionsResult.length,
      deletedDocumentVersionsCount: deletedDocumentsResult.length,
    };
    childLogger.info('Document and associated suggestions deleted completely', result);
    childLogger.trace({ result }, 'Exiting deleteDocumentCompletelyById');
    return result;
  } catch (error) {
    childLogger.error({ err: error as Error }, 'Failed to delete document completely');
    if (error instanceof ChatSDKError) throw error
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete document completely',
    )
  }
}

// END OF: lib/db/queries.ts
