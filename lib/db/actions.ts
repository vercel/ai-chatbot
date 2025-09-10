import 'server-only';

import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { chats, messages, parts } from './schema';
import { mapDBToUI, mapUIToDB, type UIMessage } from '../utils/message-mapping';

// Initialize Postgres connection using DATABASE_URL
// biome-ignore lint: Forbidden non-null assertion for env usage
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export async function createChat() {
  const [chat] = await db.insert(chats).values({}).returning();
  return chat;
}

export async function getChats() {
  return db.select().from(chats).orderBy(desc(chats.createdAt));
}

export async function loadChat(chatId: number): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .leftJoin(parts, eq(messages.id, parts.messageId))
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt), asc(parts.order));

  const grouped = new Map<number, { message: typeof messages.$inferSelect; parts: typeof parts.$inferSelect[] }>();

  for (const row of rows) {
    const msg = row.messages;
    const part = row.parts;
    if (!grouped.has(msg.id)) {
      grouped.set(msg.id, { message: msg, parts: [] });
    }
    if (part) {
      grouped.get(msg.id)!.parts.push(part);
    }
  }

  return Array.from(grouped.values()).map(({ message, parts }) =>
    mapDBToUI(message, parts),
  );
}

export async function upsertMessage(
  chatId: number,
  message: UIMessage,
): Promise<UIMessage> {
  const data = mapUIToDB(chatId, message);
  const [inserted] = await db.insert(messages).values(data.message).returning();
  const messageId = inserted.id;
  if (data.parts.length > 0) {
    await db.insert(parts).values(
      data.parts.map((p) => ({ ...p, messageId })),
    );
  }
  return { ...message, id: messageId };
}

export async function deleteChat(chatId: number) {
  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function deleteMessage(messageId: number) {
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId));
  if (!msg) return;
  await db
    .delete(messages)
    .where(and(eq(messages.chatId, msg.chatId), gte(messages.id, messageId)));
}
