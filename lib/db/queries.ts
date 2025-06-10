import 'server-only';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray, lt, SQL } from 'drizzle-orm';
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
  Chat,
  passwordResetToken,
  type PasswordResetToken,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.id, id));
    return selectedUser || null;
  } catch (error) {
    console.error('Failed to get user by id from database');
    throw error;
  }
}

export async function createUser(
  email: string,
  password: string | null = null,
  name?: string | null,
  image?: string | null
) {
  try {
    const values: any = { 
      email,
      createdAt: new Date()
    };
    
    if (password) {
      const salt = genSaltSync(10);
      const hash = hashSync(password, salt);
      values.password = hash;
    }
    
    if (name) {
      values.name = name;
    }
    
    if (image) {
      values.image = image;
    }

    const [newUser] = await db.insert(user).values(values).returning();
    return newUser;
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function updateUser(
  id: string,
  updates: {
    name?: string | null;
    image?: string | null;
    email?: string;
  }
) {
  try {
    const [updatedUser] = await db
      .update(user)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(user.id, id))
      .returning();
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user in database');
    throw error;
  }
}

export async function findOrCreateGoogleUser(
  email: string,
  name: string | null,
  image: string | null
): Promise<User> {
  try {
    // Check if user exists
    const existingUsers = await getUser(email);
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Update user info if name or image has changed
      if (existingUser.name !== name || existingUser.image !== image) {
        const updatedUser = await updateUser(existingUser.id, {
          name,
          image
        });
        return updatedUser;
      }
      
      return existingUser;
    }
    
    // Create new user
    const newUser = await createUser(email, null, name, image);
    return newUser;
  } catch (error) {
    console.error('Failed to find or create Google user');
    throw error;
  }
}

// Password Reset Functions
export async function createPasswordResetToken(userId: string): Promise<string> {
  try {
    // Generate a secure random token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Delete any existing tokens for this user
    await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, userId));
    
    // Create new token
    await db.insert(passwordResetToken).values({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    
    return token;
  } catch (error) {
    console.error('Failed to create password reset token');
    throw error;
  }
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  try {
    const [resetToken] = await db
      .select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.token, token))
      .limit(1);
    
    return resetToken || null;
  } catch (error) {
    console.error('Failed to get password reset token');
    throw error;
  }
}

export async function deletePasswordResetToken(token: string) {
  try {
    return await db.delete(passwordResetToken).where(eq(passwordResetToken.token, token));
  } catch (error) {
    console.error('Failed to delete password reset token');
    throw error;
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<User> {
  try {
    const salt = genSaltSync(10);
    const hash = hashSync(newPassword, salt);
    
    const [updatedUser] = await db
      .update(user)
      .set({ password: hash })
      .where(eq(user.id, userId))
      .returning();
    
    return updatedUser;
  } catch (error) {
    console.error('Failed to reset user password');
    throw error;
  }
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  try {
    const resetToken = await getPasswordResetToken(token);
    
    if (!resetToken) {
      return false;
    }
    
    // Check if token has expired
    const now = new Date();
    return resetToken.expiresAt > now;
  } catch (error) {
    console.error('Failed to validate password reset token');
    return false;
  }
}

// Clean up expired tokens (should be run periodically)
export async function cleanupExpiredPasswordResetTokens() {
  try {
    const now = new Date();
    return await db
      .delete(passwordResetToken)
      .where(lt(passwordResetToken.expiresAt, now));
  } catch (error) {
    console.error('Failed to cleanup expired password reset tokens');
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
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
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
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
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

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
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
    console.error('Failed to get messages by chat id from database', error);
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
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
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
    return await db.insert(document).values({
      id,
      title,
      kind,
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
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
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
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
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
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// Additional utility functions for OAuth integration

export async function linkProviderAccount({
  userId,
  provider,
  providerAccountId,
  accessToken,
  refreshToken,
}: {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  try {
    // This would require an accounts table if you want to track OAuth accounts
    // For now, we're just updating the user's info when they sign in with Google
    console.log('Provider account linked:', { userId, provider, providerAccountId });
  } catch (error) {
    console.error('Failed to link provider account');
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    // Delete user's related data first
    const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, id));
    const chatIds = userChats.map(c => c.id);
    
    if (chatIds.length > 0) {
      // Delete votes for user's chats
      await db.delete(vote).where(inArray(vote.chatId, chatIds));
      
      // Delete messages for user's chats
      await db.delete(message).where(inArray(message.chatId, chatIds));
      
      // Delete chats
      await db.delete(chat).where(eq(chat.userId, id));
    }
    
    // Delete user's documents and suggestions
    await db.delete(suggestion).where(eq(suggestion.documentId, id));
    await db.delete(document).where(eq(document.userId, id));
    
    // Delete user's password reset tokens
    await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, id));
    
    // Finally delete the user
    return await db.delete(user).where(eq(user.id, id));
  } catch (error) {
    console.error('Failed to delete user from database');
    throw error;
  }
}