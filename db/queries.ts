'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  document,
  agent,
  suggestion,
  type Agent,
  type User,
  type Suggestion,
} from './schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
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
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
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
    console.error('Failed to get document by id from database');
    throw error;
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
    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database'
    );
    throw error;
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
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database'
    );
    throw error;
  }
}

// Create a new Agent
export async function createAgent({
  name,
  description,
  customInstructions,
  aiModel,
  activatedTools,
  userId,
}: {
  name: string;
  description?: string;
  customInstructions?: string;
  aiModel: string;
  activatedTools?: object;
  userId: string;
}): Promise<Agent> {
  try {
    const [newAgent] = await db
      .insert(agent)
      .values({
        name,
        description,
        customInstructions,
        aiModel,
        activatedTools,
        userId,
      })
      .returning();
    return newAgent;
  } catch (error) {
    console.error('Failed to create Agent in database');
    throw error;
  }
}

// Get an Agent by ID
export async function getAgentById({
  id,
}: {
  id: string;
}): Promise<Agent | undefined> {
  try {
    const [selectedAgent] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, id));
    return selectedAgent;
  } catch (error) {
    console.error('Failed to get Agent by id from database');
    throw error;
  }
}

// Get all Agents for a user
export async function getAgentsByUserId({
  userId,
}: {
  userId: string;
}): Promise<Agent[]> {
  try {
    return await db.select().from(agent).where(eq(agent.userId, userId));
  } catch (error) {
    console.error('Failed to get Agents by user id from database');
    throw error;
  }
}

// Update an Agent
export async function updateAgent({
  id,
  name,
  description,
  customInstructions,
  aiModel,
  activatedTools,
}: {
  id: string;
  name?: string;
  description?: string;
  customInstructions?: string;
  aiModel?: string;
  activatedTools?: object;
}): Promise<Agent | undefined> {
  try {
    const [updatedAgent] = await db
      .update(agent)
      .set({
        name,
        description,
        customInstructions,
        aiModel,
        activatedTools,
        updatedAt: new Date(),
      })
      .where(eq(agent.id, id))
      .returning();
    return updatedAgent;
  } catch (error) {
    console.error('Failed to update Agent in database');
    throw error;
  }
}
