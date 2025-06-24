// lib/db/queries.ts - Fixed version with consistent camelCase naming
import 'server-only';
import { hash, genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray, lt, SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import crypto from 'crypto';
import {
  user,
  emailVerificationTokens,
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

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// User Management Functions
export async function createUser(
  email: string, 
  password: string | null = null, 
  name?: string | null, 
  image?: string | null
): Promise<User> {
  try {
    console.log('Creating user with:', { email, hasPassword: !!password, name, image });
    
    const values: any = { 
      email,
      createdAt: new Date(),
      emailVerified: false,
    };
    
    if (password) {
      const salt = genSaltSync(10);
      const hashPassword = hashSync(password, salt);
      values.password = hashPassword;
    }
    
    if (name) values.name = name;
    if (image) values.image = image;

    const [newUser] = await db.insert(user).values(values).returning();
    console.log('User created successfully:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    console.log('Getting user by email:', email);
    const result = await db.select().from(user).where(eq(user.email, email));
    console.log('Users found:', result.length);
    return result;
  } catch (error) {
    console.error('Failed to get user from database:', error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log('Getting user by ID:', id);
    const [selectedUser] = await db.select().from(user).where(eq(user.id, id));
    return selectedUser || null;
  } catch (error) {
    console.error('Failed to get user by id from database:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log('Getting user by email (single):', email);
    const [selectedUser] = await db.select({
      id: user.id,
      email: user.email,
      password: user.password,
      email_verified: user.email_verified,
      name: user.name,
      image: user.image,
      created_at: user.created_at,
      updated_at: user.updated_at
    })
    .from(user)
    .where(eq(user.email, email));
    
    console.log('User found:', !!selectedUser);
    return selectedUser || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function updateUser(
  id: string,
  updates: {
    name?: string | null;
    image?: string | null;
    email?: string;
    emailVerified?: boolean;
  }
): Promise<User> {
  try {
    console.log('Updating user:', id, updates);
    
    const [updatedUser] = await db
      .update(user)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(user.id, id))
      .returning();
      
    console.log('User updated successfully');
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user in database:', error);
    throw error;
  }
}

// Email Verification Functions
export async function createEmailVerificationToken(userId: string): Promise<string> {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Creating email verification token for user:', userId);
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    console.log('Creating verification token:', { userId, otp, expiresAt });
    
    // Delete any existing tokens for this user first
    await db.delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.user_id, userId));
    
    // Insert new token
    await db.insert(emailVerificationTokens).values({
      id: crypto.randomUUID(),
      user_id: userId,
      token: otp,
      expires_at: expiresAt,
      created_at: new Date(),
    });
    
    console.log('Email verification token created successfully');
    return otp;
  } catch (error) {
    console.error('Error creating email verification token:', error);
    throw new Error('Failed to create email verification token');
  }
}

export async function verifyEmailToken(otp: string): Promise<{ success: boolean; userId?: string; userEmail?: string }> {
  try {
    console.log('Verifying OTP:', otp);
    
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, otp))
      .limit(1);
    
    if (!tokenRecord) {
      console.log('Token not found');
      return { success: false };
    }
    
    console.log('Token found:', { userId: tokenRecord.user_id, expiresAt: tokenRecord.expires_at });
    
    // Check if token has expired
    if (new Date() > tokenRecord.expires_at) {
      console.log('Token expired');
      await db.delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, tokenRecord.id));
      return { success: false };
    }
    
    // Get user details before updating
    const [userData] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, tokenRecord.user_id))
      .limit(1);
    
    // Mark user as verified
    await db.update(user)
      .set({ 
        email_verified: true,
        updated_at: new Date()
      })
      .where(eq(user.id, tokenRecord.user_id));
    
    // Delete the used token
    await db.delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, tokenRecord.id));
    
    console.log('Email verified successfully');
    return { 
      success: true, 
      userId: tokenRecord.user_id,
      userEmail: userData?.email
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return { success: false };
  }
}

// OAuth Integration
export async function findOrCreateGoogleUser(
  email: string,
  name: string | null,
  image: string | null
): Promise<User> {
  try {
    console.log('Finding or creating Google user:', email);
    
    const existingUsers = await getUser(email);
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('Google user exists, updating info');
      
      if (existingUser.name !== name || existingUser.image !== image || !existingUser.email_verified) {
        const updatedUser = await updateUser(existingUser.id, {
          name,
          image,
          emailVerified: true, // OAuth users are considered verified
        });
        return updatedUser;
      }
      
      return existingUser;
    }
    
    console.log('Creating new Google user');
    const newUser = await createUser(email, null, name, image);
    const updatedUser = await updateUser(newUser.id, { emailVerified: true });
    return updatedUser;
  } catch (error) {
    console.error('Failed to find or create Google user:', error);
    throw error;
  }
}

// Password Reset Functions
export async function createPasswordResetToken(userId: string): Promise<string> {
  try {
    console.log('Creating password reset token for user:', userId);
    
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, userId));
    
    await db.insert(passwordResetToken).values({
      userId: userId,
      token,
      expiresAt: expiresAt,
      createdAt: new Date(),
    });
    
    console.log('Password reset token created successfully');
    return token;
  } catch (error) {
    console.error('Failed to create password reset token:', error);
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
    console.error('Failed to get password reset token:', error);
    throw error;
  }
}

export async function deletePasswordResetToken(token: string) {
  try {
    return await db.delete(passwordResetToken).where(eq(passwordResetToken.token, token));
  } catch (error) {
    console.error('Failed to delete password reset token:', error);
    throw error;
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<User> {
  try {
    console.log('Resetting password for user:', userId);
    
    const salt = genSaltSync(10);
    const hashPassword = hashSync(newPassword, salt);
    
    const [updatedUser] = await db
      .update(user)
      .set({ 
        password: hashPassword,
        updated_at: new Date()
      })
      .where(eq(user.id, userId))
      .returning();
    
    console.log('Password reset successfully');
    return updatedUser;
  } catch (error) {
    console.error('Failed to reset user password:', error);
    throw error;
  }
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  try {
    const resetToken = await getPasswordResetToken(token);
    
    if (!resetToken) {
      return false;
    }
    
    const now = new Date();
    return resetToken.expiresAt > now;
  } catch (error) {
    console.error('Failed to validate password reset token:', error);
    return false;
  }
}

// Cleanup Functions
export async function cleanupExpiredPasswordResetTokens() {
  try {
    const now = new Date();
    return await db
      .delete(passwordResetToken)
      .where(lt(passwordResetToken.expiresAt, now));
  } catch (error) {
    console.error('Failed to cleanup expired password reset tokens:', error);
    throw error;
  }
}

export async function cleanupExpiredEmailVerificationTokens() {
  try {
    const now = new Date();
    return await db
      .delete(emailVerificationTokens)
      .where(lt(emailVerificationTokens.expires_at, now));
  } catch (error) {
    console.error('Failed to cleanup expired email verification tokens:', error);
    throw error;
  }
}

// Chat Management Functions
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
      userId: userId,
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

// Message Management Functions
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

// Vote Management Functions
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
      chatId: chatId,
      messageId: messageId,
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

// Document Management Functions
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
      userId: userId,
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

// Suggestion Management Functions
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

// Utility Functions for OAuth and Account Management
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
    console.log('Provider account linked:', { userId, provider, providerAccountId });
    return true;
  } catch (error) {
    console.error('Failed to link provider account');
    throw error;
  }
}

// Delete user function with proper column naming
export async function deleteUser(id: string) {
  try {
    console.log('Deleting user:', id);
    
    // Delete user's related data first
    const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, id));
    const chatIds = userChats.map(c => c.id);
    
    if (chatIds.length > 0) {
      await db.delete(vote).where(inArray(vote.chatId, chatIds));
      await db.delete(message).where(inArray(message.chatId, chatIds));
      await db.delete(chat).where(eq(chat.userId, id));
    }
    
    // Get user's documents first, then delete related suggestions
    const userDocuments = await db.select({ id: document.id }).from(document).where(eq(document.userId, id));
    const documentIds = userDocuments.map(d => d.id);
    
    if (documentIds.length > 0) {
      await db.delete(suggestion).where(inArray(suggestion.documentId, documentIds));
    }
    await db.delete(document).where(eq(document.userId, id));
    
    // Delete user's tokens
    await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, id));
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.user_id, id));
    
    // Finally delete the user
    const result = await db.delete(user).where(eq(user.id, id));
    console.log('User deleted successfully');
    return result;
  } catch (error) {
    console.error('Failed to delete user from database:', error);
    throw error;
  }
}