/**
 * @file lib/db/queries.ts
 * @description Функции для выполнения запросов к базе данных.
 * @version 1.8.0
 * @date 2025-06-06
 * @updated Добавлена конфигурация idle_timeout и max_lifetime для postgres-js для предотвращения ошибок "Socket closed unexpectedly".
 */

/** HISTORY:
 * v1.8.0 (2025-06-06): Добавлена конфигурация для postgres-js для стабильной работы в serverless-среде.
 * v1.7.0 (2025-06-06): Добавлена поддержка `authorId` и версионирования в `getDocumentById`. Удалены функции, связанные с голосованием.
 * v1.6.0 (2025-06-06): Функции `getRecent...` и `getPaged...` обобщены для работы со всеми видами контента.
 */

import 'server-only'

import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lt, sql, type SQL, } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import {
  chat,
  type Chat,
  type DBMessage,
  document,
  type Document as DBDocument,
  message,
  stream,
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

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  idle_timeout: 20, // Автоматическое закрытие неактивных соединений через 20 секунд
  max_lifetime: 60 * 5, // Принудительное пересоздание соединения каждые 5 минут
})
const db = drizzle(client)

export async function getUser (email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email))
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get user by email for ${email}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    )
  }
}

export async function createUser (email: string, password: string) {
  const hashedPassword = generateHashedPassword(password)

  try {
    return await db.insert(user).values({ email, password: hashedPassword })
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to create user for ${email}`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to create user')
  }
}

export async function createGuestUser () {
  const email = `guest-${Date.now()}`
  const password = generateHashedPassword(generateUUID())

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to create guest user`, error)
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
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    }).onConflictDoNothing()
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to save chat ${id} for user ${userId}`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to save chat')
  }
}

export async function deleteChatById ({ id }: { id: string }) {
  try {
    await db.delete(message).where(eq(message.chatId, id))
    await db.delete(stream).where(eq(stream.chatId, id))

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning()
    return chatsDeleted
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to delete chat by id ${id}`, error)
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
  try {
    const extendedLimit = limit + 1

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
        .limit(extendedLimit)

    let filteredChats: Array<Chat> = []

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1)

      if (!selectedChat) {
        console.warn(`SYS_VS_DB: Chat for starting_after not found: ${startingAfter}`)
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        )
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt))
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1)

      if (!selectedChat) {
        console.warn(`SYS_VS_DB: Chat for ending_before not found: ${endingBefore}`)
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        )
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt))
    } else {
      filteredChats = await query()
    }

    const hasMore = filteredChats.length > limit

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    }
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get chats by user id ${id}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    )
  }
}

export async function getChatById ({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id))
    return selectedChat
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get chat by id ${id}`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id')
  }
}

export async function saveMessages ({
  messages: messagesToSave,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messagesToSave)
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to save ${messagesToSave.length} messages`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to save messages')
  }
}

export async function getMessagesByChatId ({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt))
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get messages by chat id ${id}`, error)
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
  try {
    return await db
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
      .returning()
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to save document ${id} (kind: ${kind}) for user ${userId}`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to save document')
  }
}

export async function getDocumentsById ({ id }: { id: string }): Promise<Array<DBDocument>> {
  try {
    const documentsResult = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt))

    return documentsResult
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get documents by id ${id}`, error)
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
  try {
    const allVersions = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt))

    if (allVersions.length === 0) {
      return undefined
    }

    const totalVersions = allVersions.length
    let selectedDocument: DBDocument

    if (version != null && version > 0 && version <= totalVersions) {
      // Версия 1-индексированная
      selectedDocument = allVersions[version - 1]
    } else {
      // Последняя версия по умолчанию
      selectedDocument = allVersions[totalVersions - 1]
    }

    return { doc: selectedDocument, totalVersions }
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get document by id ${id} (version: ${version})`, error)
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
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      )

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning()
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to delete documents by id ${id} after timestamp ${timestamp}`, error)
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
  try {
    return await db.insert(suggestion).values(suggestionsToSave)
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to save ${suggestionsToSave.length} suggestions`, error)
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
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)))
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get suggestions by document id ${documentId}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    )
  }
}

export async function getMessageById ({ id }: { id: string }): Promise<DBMessage | undefined> {
  try {
    const [result] = await db.select().from(message).where(eq(message.id, id))
    return result
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get message by id ${id}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    )
  }
}

export async function deleteMessageById ({ messageId }: { messageId: string }): Promise<DBMessage | undefined> {
  try {
    const [deletedMessage] = await db.delete(message).where(eq(message.id, messageId)).returning()
    return deletedMessage
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to delete message by id ${messageId}`, error)
    throw new ChatSDKError('bad_request:database', 'Failed to delete message')
  }
}

export async function getMessageWithSiblings ({ messageId }: { messageId: string }) {
  const targetMessage = await getMessageById({ id: messageId })
  if (!targetMessage) return null

  const allMessages = await getMessagesByChatId({ id: targetMessage.chatId })
  const targetIndex = allMessages.findIndex(m => m.id === messageId)

  if (targetIndex === -1) return null

  return {
    previous: targetIndex > 0 ? allMessages[targetIndex - 1] : undefined,
    current: targetMessage,
    next: targetIndex < allMessages.length - 1 ? allMessages[targetIndex + 1] : undefined,
    all: allMessages,
  }
}

export async function deleteMessagesByChatIdAfterTimestamp ({
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
      )

    const messageIds = messagesToDelete.map((msg) => msg.id)

    if (messageIds.length > 0) {
      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        )
    }
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to delete messages by chat id ${chatId} after timestamp ${timestamp}`, error)
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
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to update chat visibility by id ${chatId} to ${visibility}`, error)
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
  try {
    const targetDate = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    )

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
      .execute()

    return stats?.count ?? 0
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get message count by user id ${id} for last ${differenceInHours} hours`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    )
  }
}

export async function createStreamId ({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() })
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to create stream id ${streamId} for chat ${chatId}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    )
  }
}

export async function getStreamIdsByChatId ({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute()

    return streamIds.map(({ id }) => id)
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get stream ids by chat id ${chatId}`, error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
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
}): Promise<Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>[]> {
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
      })
      .from(latestVersionsSubquery)
      .where(and(...whereConditions))
      .orderBy(desc(latestVersionsSubquery.createdAt))
      .limit(limit)

    return documentsResult
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get recent content for user ${userId}, kind ${kind}`, error)
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
}): Promise<{ data: Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'content' | 'kind'>[], totalCount: number }> {
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

    return {
      data,
      totalCount: totalCountResult[0]?.count ?? 0,
    }

  } catch (error) {
    console.error(`SYS_VS_DB: Failed to get paged content for user ${userId}`, error)
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
  try {
    const userDocuments = await db
      .select({ id: document.id })
      .from(document)
      .where(and(eq(document.id, documentId), eq(document.userId, userId)))
      .limit(1)

    if (userDocuments.length === 0) {
      console.warn(`SYS_VS_DB: Attempt to delete document ${documentId} not belonging to user ${userId} or not found`)
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

    return {
      deletedSuggestionsCount: deletedSuggestionsResult.length,
      deletedDocumentVersionsCount: deletedDocumentsResult.length,
    }
  } catch (error) {
    console.error(`SYS_VS_DB: Failed to delete document ${documentId} completely for user ${userId}`, error)
    if (error instanceof ChatSDKError) throw error
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete document completely',
    )
  }
}

// END OF: lib/db/queries.ts
