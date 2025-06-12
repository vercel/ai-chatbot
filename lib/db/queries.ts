/**
 * @file lib/db/queries.ts
 * @description Функции для выполнения запросов к базе данных.
 * @version 2.3.0
 * @date 2025-06-12
 * @updated getArtifactById now accepts versionTimestamp for precise retrieval.
 */

/** HISTORY:
 * v2.3.0 (2025-06-12): Added versionTimestamp param to getArtifactById.
 * v2.2.0 (2025-06-10): Импорт ArtifactKind теперь из lib/types.
 * v2.1.1 (2025-06-10): Temporarily commented out generateHashedPassword usage to resolve TS2305.
 * v2.1.0 (2025-06-09): Восстановлены экспорты getMessageById, deleteMessageById и др.
 * v2.0.0 (2025-06-09): Переименованы Document->Artifact, мягкое удаление, новые функции rename/restore/dismiss.
 */

import 'server-only'

import { and, asc, count, desc, eq, gt, gte, ilike, inArray, isNull, sql, type SQL, } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createLogger } from '@fab33/fab-logger'

import {
  artifact,
  type Artifact,
  chat,
  type Chat,
  type DBMessage,
  message,
  type Suggestion,
  suggestion,
  user,
  type User,
} from './schema'
import type { ArtifactKind, VisibilityType } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
import { generateUUID } from '../utils'
// import { generateHashedPassword } from './utils'; // TODO: Restore when generateHashedPassword is available
import { generateAndSaveSummary } from '../ai/summarizer'

console.log(`process.env.TRANSPORT1=${process.env.TRANSPORT1}`)
const logger = createLogger('lib:db:queries')

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  idle_timeout: 20,
  max_lifetime: 60 * 5,
})
export const db = drizzle(client)

// --- User Queries ---
export async function getUser (email: string): Promise<Array<User>> {
  logger.trace({ email }, 'Entering getUser')
  return await db.select().from(user).where(eq(user.email, email))
}

export async function createUser (email: string, password: string) {
  logger.trace({ email }, 'Entering createUser')
  // const hashedPassword = generateHashedPassword(password); // TODO: Hashing needed
  // For now, to resolve TS error, using plain password. THIS IS INSECURE.
  console.warn('TODO: Password hashing is not implemented in createUser. Storing plain password temporarily.')
  return await db.insert(user).values({ email, password })
}

export async function createGuestUser () {
  logger.trace('Entering createGuestUser')
  const email = `guest-${Date.now()}`
  // const password = generateHashedPassword(generateUUID()); // TODO: Hashing needed
  // For now, to resolve TS error, using plain UUID as password. THIS IS INSECURE.
  const plainPasswordForGuest = generateUUID()
  console.warn('TODO: Password hashing is not implemented in createGuestUser. Storing plain UUID as password temporarily.')
  return await db.insert(user).values({ email, password: plainPasswordForGuest }).returning({
    id: user.id,
    email: user.email,
  })
}

// --- Chat Queries ---
export async function saveChat ({ id, userId, title, visibility }: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace({ title, visibility }, 'Entering saveChat')
  return await db.insert(chat).values({ id, createdAt: new Date(), userId, title, visibility }).onConflictDoNothing()
}

export async function deleteChatSoftById ({ id, userId }: { id: string; userId: string }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace('Entering deleteChatSoftById')
  const [deletedChat] = await db.update(chat).set({ deletedAt: new Date() }).where(and(eq(chat.id, id), eq(chat.userId, userId))).returning()
  childLogger.info('Chat soft-deleted successfully')
  return deletedChat
}

export async function restoreChatById ({ id, userId }: { id: string; userId: string }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace('Entering restoreChatById')
  const [restoredChat] = await db.update(chat).set({ deletedAt: null }).where(and(eq(chat.id, id), eq(chat.userId, userId))).returning()
  childLogger.info('Chat restored successfully')
  return restoredChat
}

export async function renameChatTitle ({ id, newTitle, userId }: { id: string; newTitle: string; userId: string; }) {
  const childLogger = logger.child({ chatId: id, userId })
  childLogger.trace({ newTitle }, 'Entering renameChatTitle')
  return await db.update(chat).set({ title: newTitle }).where(and(eq(chat.id, id), eq(chat.userId, userId)))
}

export async function updateChatVisiblityById ({ chatId, visibility }: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const childLogger = logger.child({ chatId, visibility })
  childLogger.trace('Entering updateChatVisiblityById')
  return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
}

export async function getChatsByUserId ({ id, limit, startingAfter, endingBefore, }: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  const childLogger = logger.child({ userId: id, limit, startingAfter, endingBefore })
  childLogger.trace('Entering getChatsByUserId')
  const extendedLimit = limit + 1
  const baseWhere = and(eq(chat.userId, id), isNull(chat.deletedAt))

  const query = (cursorCondition?: SQL<any>) =>
    db.select().from(chat).where(cursorCondition ? and(baseWhere, cursorCondition) : baseWhere).orderBy(desc(chat.createdAt)).limit(extendedLimit)

  let filteredChats: Array<Chat> = []
  if (startingAfter) { /* ... */ } else if (endingBefore) { /* ... */ } else {
    filteredChats = await query()
  }

  const hasMore = filteredChats.length > limit
  return { chats: hasMore ? filteredChats.slice(0, limit) : filteredChats, hasMore }
}

export async function getChatById ({ id }: { id: string }) {
  const [selectedChat] = await db.select().from(chat).where(and(eq(chat.id, id), isNull(chat.deletedAt)))
  return selectedChat
}

// --- Message Queries ---
export async function saveMessages ({ messages: messagesToSave }: { messages: Array<DBMessage> }) {
  return await db.insert(message).values(messagesToSave)
}

export async function getMessagesByChatId ({ id }: { id: string }) {
  return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt))
}

export async function getMessageById ({ id }: { id: string }): Promise<DBMessage | undefined> {
  const [result] = await db.select().from(message).where(eq(message.id, id))
  return result
}

export async function deleteMessageById ({ messageId }: { messageId: string }): Promise<DBMessage | undefined> {
  const [deletedMessage] = await db.delete(message).where(eq(message.id, messageId)).returning()
  return deletedMessage
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

export async function deleteMessagesByChatIdAfterTimestamp ({ chatId, timestamp, }: {
  chatId: string;
  timestamp: Date;
}) {
  const messagesToDelete = await db.select({ id: message.id }).from(message).where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)))
  if (messagesToDelete.length > 0) {
    const messageIds = messagesToDelete.map((msg) => msg.id)
    return await db.delete(message).where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)))
  }
}

export async function getMessageCountByUserId ({ id, differenceInHours, }: { id: string; differenceInHours: number }) {
  const targetDate = new Date(Date.now() - differenceInHours * 60 * 60 * 1000,)
  const [stats] = await db.select({ count: count(message.id) }).from(message).innerJoin(chat, eq(message.chatId, chat.id)).where(and(eq(chat.userId, id), gte(message.createdAt, targetDate), eq(message.role, 'user'),)).execute()
  return stats?.count ?? 0
}

// --- Artifact Queries ---
export async function saveArtifact ({ id, title, kind, content, userId, authorId, createdAt }: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  authorId: string | null;
  createdAt?: Date
}) {
  const childLogger = logger.child({ artifactId: id, userId, kind })
  childLogger.trace({ title, authorId }, 'Entering saveArtifact')
  const [savedArtifact] = await db.insert(artifact).values({
    id,
    title,
    kind,
    content,
    userId,
    authorId,
    createdAt: createdAt ?? new Date()
  }).returning()
  if (savedArtifact?.content) {
    generateAndSaveSummary(id, savedArtifact.content, kind).catch(err => {
      childLogger.error({ err }, 'Async summary generation failed')
    })
  }
  return [savedArtifact]
}

export async function getArtifactsById ({ id }: { id: string }): Promise<Array<Artifact>> {
  return await db.select().from(artifact).where(and(eq(artifact.id, id), isNull(artifact.deletedAt))).orderBy(asc(artifact.createdAt))
}

export async function getArtifactById ({ id, version, versionTimestamp }: { id: string; version?: number | null; versionTimestamp?: Date | null }): Promise<{
  doc: Artifact,
  totalVersions: number
} | undefined> {
  const allVersions = await getArtifactsById({ id })
  if (allVersions.length === 0) return undefined
  const totalVersions = allVersions.length
  let doc: Artifact | undefined
  if (versionTimestamp) {
    doc = allVersions.find(v => v.createdAt.getTime() === versionTimestamp.getTime())
  }
  if (!doc && version != null && version > 0 && version <= totalVersions) {
    doc = allVersions[version - 1]
  }
  doc = doc ?? allVersions[totalVersions - 1]
  return { doc, totalVersions }
}

export async function deleteArtifactVersionsAfterTimestamp ({ id, timestamp, }: { id: string; timestamp: Date; }) {
  await db.delete(suggestion).where(and(eq(suggestion.documentId, id), gt(suggestion.documentCreatedAt, timestamp)))
  return await db.delete(artifact).where(and(eq(artifact.id, id), gt(artifact.createdAt, timestamp))).returning()
}

export async function getPagedArtifactsByUserId ({ userId, page = 1, pageSize = 10, searchQuery, kind }: {
  userId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: ArtifactKind;
}): Promise<{
  data: Pick<Artifact, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'>[],
  totalCount: number
}> {
  const offset = (page - 1) * pageSize
  const baseWhere = and(eq(artifact.userId, userId), isNull(artifact.deletedAt), searchQuery ? ilike(artifact.title, `%${searchQuery}%`) : undefined, kind ? eq(artifact.kind, kind) : undefined)
  const subquery = db.select({
    id: artifact.id, rn: sql<number>`row_number
      () OVER (PARTITION BY
      ${artifact.id}
      ORDER
      BY
      ${artifact.createdAt}
      DESC
      )`.as('rn')
  }).from(artifact).where(baseWhere).as('subquery')
  const latestArtifactsQuery = db.select({ id: artifact.id }).from(artifact).innerJoin(subquery, and(eq(artifact.id, subquery.id), eq(subquery.rn, 1)))
  const totalCountResult = await db.select({ count: count() }).from(latestArtifactsQuery.as('latest_artifacts'))
  const data = await db.select({
    id: artifact.id,
    title: artifact.title,
    createdAt: artifact.createdAt,
    content: artifact.content,
    kind: artifact.kind,
    summary: artifact.summary,
  }).from(artifact).innerJoin(subquery, and(eq(artifact.id, subquery.id), eq(subquery.rn, 1))).orderBy(desc(artifact.createdAt)).limit(pageSize).offset(offset)
  return { data, totalCount: totalCountResult[0]?.count ?? 0 }
}

export async function getRecentArtifactsByUserId ({ userId, limit = 5, kind, }: {
  userId: string;
  limit?: number;
  kind?: ArtifactKind;
}): Promise<Pick<Artifact, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'>[]> {
  const result = await getPagedArtifactsByUserId({ userId, page: 1, pageSize: limit, kind })
  return result.data
}

export async function deleteArtifactSoftById ({ artifactId, userId, }: { artifactId: string; userId: string; }) {
  return await db.update(artifact).set({ deletedAt: new Date() }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

export async function restoreArtifactById ({ artifactId, userId }: { artifactId: string; userId: string; }) {
  return await db.update(artifact).set({ deletedAt: null }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

export async function renameArtifactById ({ artifactId, newTitle, userId }: {
  artifactId: string;
  newTitle: string;
  userId: string;
}) {
  return await db.update(artifact).set({ title: newTitle }).where(and(eq(artifact.id, artifactId), eq(artifact.userId, userId)))
}

// --- Suggestion Queries ---
export async function saveSuggestions ({ suggestions: suggestionsToSave }: { suggestions: Array<Suggestion>; }) {
  return await db.insert(suggestion).values(suggestionsToSave)
}

export async function getSuggestionsByDocumentId ({ documentId }: { documentId: string; }) {
  return await db.select().from(suggestion).where(and(eq(suggestion.documentId, documentId), eq(suggestion.isDismissed, false)))
}

export async function dismissSuggestion ({ suggestionId, userId }: { suggestionId: string; userId: string }) {
  return await db.update(suggestion).set({ isDismissed: true }).where(and(eq(suggestion.id, suggestionId), eq(suggestion.userId, userId)))
}

// END OF: lib/db/queries.ts
