import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, sql } from 'drizzle-orm';
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
} from './schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export type Visibility = 'public' | 'private';

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
    const [result] = await db.select().from(chat).where(eq(chat.id, id));
    return result;
  } catch (error) {
    console.error('Failed to get chat from database', error);
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
    console.error('Failed to get messages from database', error);
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

export async function getHistory() {
  try {
    return await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        visibility: chat.visibility,
      })
      .from(chat)
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get history from database', error);
    throw error;
  }
}

export async function createChat({
  id,
  title,
  visibility,
  userId,
}: {
  id: string;
  title: string;
  visibility: Visibility;
  userId: string;
}) {
  try {
    await db.insert(chat).values({
      id,
      title,
      visibility,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create chat in database', error);
    throw error;
  }
}

export async function updateChat({
  id,
  title,
  visibility,
}: {
  id: string;
  title: string;
  visibility: Visibility;
}) {
  try {
    await db
      .update(chat)
      .set({
        title,
        visibility,
      })
      .where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to update chat in database', error);
    throw error;
  }
}

export async function deleteChat({ id }: { id: string }) {
  try {
    await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat from database', error);
    throw error;
  }
}

export async function createMessage({
  chatId,
  role,
  content,
}: {
  chatId: string;
  role: string;
  content: unknown;
}) {
  try {
    await db.insert(message).values({
      chatId,
      role,
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create message in database', error);
    throw error;
  }
}

export async function deleteMessage({ id }: { id: string }) {
  try {
    await db.delete(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to delete message from database', error);
    throw error;
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const [targetMessage] = await db
      .select({
        chatId: message.chatId,
        createdAt: message.createdAt,
      })
      .from(message)
      .where(eq(message.id, id));

    if (!targetMessage) {
      throw new Error('Message not found');
    }

    await db
      .delete(message)
      .where(
        and(
          eq(message.chatId, targetMessage.chatId),
          sql`${message.createdAt} >= ${targetMessage.createdAt}`,
        ),
      );
  } catch (error) {
    console.error('Failed to delete trailing messages from database', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const [result] = await db.select().from(message).where(eq(message.id, id));
    return result;
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
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
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
  visibility: Visibility;
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
