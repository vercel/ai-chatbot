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
  invitation,
  type Invitation,
  modelSettings,
  type ModelSettings,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import { supabase, shouldUseSupabaseClient } from './supabase';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Database connection - safe for serverless
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', email);
      
      if (error) {
        console.error('[getUser] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get user by email',
        );
      }
      
      return data || [];
    }
    
    // Use direct connection in development
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(
  email: string, 
  password: string, 
  invitedBy?: string
) {
  const hashedPassword = generateHashedPassword(password);

  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('User')
        .insert({
          email,
          password: hashedPassword,
          invitedBy: invitedBy || null,
        })
        .select();
      
      if (error) {
        console.error('[createUser] Supabase error:', error);
        throw new ChatSDKError('bad_request:database', 'Failed to create user');
      }
      
      return data;
    }
    
    // Use direct connection in development
    return await db.insert(user).values({ 
      email, 
      password: hashedPassword,
      invitedBy: invitedBy || null,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('User')
        .insert({ email, password })
        .select('id, email');
      
      if (error) {
        console.error('[createGuestUser] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to create guest user',
        );
      }
      
      return data;
    }
    
    // Use direct connection in development
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
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('Chat')
        .insert({
          id,
          createdAt: new Date().toISOString(),
          userId,
          title,
          visibility,
        })
        .select();
      
      if (error) {
        console.error('[saveChat] Supabase error:', error);
        throw new ChatSDKError('bad_request:database', 'Failed to save chat');
      }
      
      return data;
    }
    
    // Use direct connection in development
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
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
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const extendedLimit = limit + 1;
      let query = supabase
        .from('Chat')
        .select('*')
        .eq('userId', id)
        .order('createdAt', { ascending: false })
        .limit(extendedLimit);

      if (startingAfter) {
        const { data: selectedChat } = await supabase
          .from('Chat')
          .select('*')
          .eq('id', startingAfter)
          .single();

        if (!selectedChat) {
          throw new ChatSDKError(
            'not_found:database',
            `Chat with id ${startingAfter} not found`,
          );
        }

        query = query.gt('createdAt', selectedChat.createdAt);
      } else if (endingBefore) {
        const { data: selectedChat } = await supabase
          .from('Chat')
          .select('*')
          .eq('id', endingBefore)
          .single();

        if (!selectedChat) {
          throw new ChatSDKError(
            'not_found:database',
            `Chat with id ${endingBefore} not found`,
          );
        }

        query = query.lt('createdAt', selectedChat.createdAt);
      }

      const { data: filteredChats, error } = await query;

      if (error) {
        console.error('[getChatsByUserId] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get chats by user id',
        );
      }

      const chats = filteredChats || [];
      const hasMore = chats.length > limit;

      return {
        chats: hasMore ? chats.slice(0, limit) : chats,
        hasMore,
      };
    }

    // Use direct connection in development
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('Chat')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('[getChatById] Supabase error:', error);
        throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
      }
      
      return data || undefined;
    }
    
    // Use direct connection in development
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
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

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
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

// Invitation-related queries
export async function createInvitation({
  email,
  invitedBy,
  expiresInDays = 7,
}: {
  email: string;
  invitedBy: string;
  expiresInDays?: number;
}) {
  const token = generateUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  try {
    const [newInvitation] = await db
      .insert(invitation)
      .values({
        email,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();
    
    return newInvitation;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create invitation',
    );
  }
}

export async function getInvitationByToken(token: string) {
  try {
    const [invite] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token));
    
    return invite;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get invitation by token',
    );
  }
}

export async function getInvitationsByEmail(email: string) {
  try {
    return await db
      .select()
      .from(invitation)
      .where(eq(invitation.email, email))
      .orderBy(desc(invitation.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get invitations by email',
    );
  }
}

export async function getInvitationsByInviter(inviterId: string) {
  try {
    return await db
      .select()
      .from(invitation)
      .where(eq(invitation.invitedBy, inviterId))
      .orderBy(desc(invitation.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get invitations by inviter',
    );
  }
}

export async function updateInvitationStatus(
  token: string,
  status: 'accepted' | 'expired' | 'revoked',
) {
  try {
    const updates: any = { status };
    if (status === 'accepted') {
      updates.acceptedAt = new Date();
    }

    const [updated] = await db
      .update(invitation)
      .set(updates)
      .where(eq(invitation.token, token))
      .returning();
    
    return updated;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update invitation status',
    );
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('User')
        .select('isAdmin')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[isUserAdmin] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to check admin status',
        );
      }
      
      return data?.isAdmin ?? false;
    }
    
    // Use direct connection in development
    const [userRecord] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, userId));
    
    return userRecord?.isAdmin ?? false;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check admin status',
    );
  }
}

export async function getAllUsers() {
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('User')
        .select('id, email, isAdmin, createdAt, invitedBy')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('[getAllUsers] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get all users',
        );
      }
      
      return data || [];
    }
    
    // Use direct connection in development
    return await db
      .select({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        invitedBy: user.invitedBy,
      })
      .from(user)
      .orderBy(desc(user.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all users',
    );
  }
}

// Model settings queries
export async function getModelSettings(modelId?: string) {
  try {
    // Use Supabase client in production
    if (shouldUseSupabaseClient()) {
      if (modelId) {
        const { data, error } = await supabase
          .from('ModelSettings')
          .select('*')
          .eq('modelId', modelId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('[getModelSettings] Supabase error:', error);
          throw new ChatSDKError(
            'bad_request:database',
            'Failed to get model settings',
          );
        }
        
        return data || undefined;
      }
      
      const { data, error } = await supabase
        .from('ModelSettings')
        .select('*')
        .order('modelId', { ascending: true });
      
      if (error) {
        console.error('[getModelSettings] Supabase error:', error);
        // Don't throw error for missing table, just return empty array
        if (error.code === 'PGRST204' || error.code === '42P01') {
          return [];
        }
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get model settings',
        );
      }
      
      return data || [];
    }
    
    // Use direct connection in development
    if (modelId) {
      const [settings] = await db
        .select()
        .from(modelSettings)
        .where(eq(modelSettings.modelId, modelId));
      return settings;
    }
    
    return await db
      .select()
      .from(modelSettings)
      .orderBy(asc(modelSettings.modelId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get model settings',
    );
  }
}

export async function upsertModelSettings({
  modelId,
  isEnabled,
  isHidden,
  customName,
  customDescription,
  maxTier,
}: {
  modelId: string;
  isEnabled?: boolean;
  isHidden?: boolean;
  customName?: string;
  customDescription?: string;
  maxTier?: 'low' | 'medium' | 'high' | 'premium';
}) {
  try {
    const existing = await getModelSettings(modelId) as any;
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(modelSettings)
        .set({
          isEnabled: isEnabled ?? existing.isEnabled,
          isHidden: isHidden ?? existing.isHidden,
          customName: customName ?? existing.customName,
          customDescription: customDescription ?? existing.customDescription,
          maxTier: maxTier ?? existing.maxTier,
          updatedAt: new Date(),
        })
        .where(eq(modelSettings.modelId, modelId))
        .returning();
      
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(modelSettings)
        .values({
          modelId,
          isEnabled: isEnabled ?? true,
          isHidden: isHidden ?? false,
          customName,
          customDescription,
          maxTier,
        })
        .returning();
      
      return created;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update model settings',
    );
  }
}

export async function toggleModelEnabled(modelId: string, isEnabled: boolean) {
  try {
    return await upsertModelSettings({ modelId, isEnabled });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to toggle model status',
    );
  }
}
