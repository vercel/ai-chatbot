import 'server-only';
import { createServerClient } from './client';
import { ChatSDKError } from '../errors';
import type { AppUsage } from '../usage';
import type { ArtifactKind } from '@/components/artifact';
import type { VisibilityType } from '@/components/visibility-selector';
import { generateUUID } from '../utils';
import { generateHashedPassword } from '../db/utils';
import { User } from './auth';

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
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('Chat')
      .insert({
        id,
        createdAt: new Date().toISOString(),
        userId,
        title,
        visibility,
      });
      
    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    // Delete votes
    await supabase
      .from('Vote_v2')
      .delete()
      .eq('chatId', id);
    
    // Delete messages
    await supabase
      .from('Message_v2')
      .delete()
      .eq('chatId', id);
    
    // Delete streams
    await supabase
      .from('Stream')
      .delete()
      .eq('chatId', id);
    
    // Delete chat and return it
    const { data, error } = await supabase
      .from('Chat')
      .delete()
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete chat by id');
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
    const supabase = createServerClient();
    const extendedLimit = limit + 1;
    
    let query = supabase
      .from('Chat')
      .select('*')
      .eq('userId', id)
      .order('createdAt', { ascending: false })
      .limit(extendedLimit);
    
    if (startingAfter) {
      // First get the chat we're starting after
      const { data: selectedChat, error } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', startingAfter)
        .single();
      
      if (error || !selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`
        );
      }
      
      // Then query for chats created after it
      query = query.gt('createdAt', selectedChat.createdAt);
    } else if (endingBefore) {
      // First get the chat we're ending before
      const { data: selectedChat, error } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', endingBefore)
        .single();
      
      if (error || !selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`
        );
      }
      
      // Then query for chats created before it
      query = query.lt('createdAt', selectedChat.createdAt);
    }
    
    const { data: filteredChats, error } = await query;
    
    if (error) throw error;
    
    const hasMore = filteredChats.length > limit;
    
    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chats by user id');
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Chat')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found error
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<{
    id: string;
    chatId: string;
    role: string;
    parts: any;
    attachments: any;
    createdAt: Date;
  }>;
}) {
  try {
    const supabase = createServerClient();
    
    const formattedMessages = messages.map(message => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));
    
    const { error } = await supabase
      .from('Message_v2')
      .insert(formattedMessages);
    
    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Message_v2')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get messages by chat id');
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
    const supabase = createServerClient();
    
    // Check if vote exists
    const { data: existingVote, error: fetchError } = await supabase
      .from('Vote_v2')
      .select('*')
      .eq('messageId', messageId)
      .eq('chatId', chatId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    if (existingVote) {
      // Update existing vote
      const { error } = await supabase
        .from('Vote_v2')
        .update({ isUpvoted: type === 'up' })
        .eq('messageId', messageId)
        .eq('chatId', chatId);
      
      if (error) throw error;
    } else {
      // Create new vote
      const { error } = await supabase
        .from('Vote_v2')
        .insert({
          chatId,
          messageId,
          isUpvoted: type === 'up',
        });
      
      if (error) throw error;
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Vote_v2')
      .select('*')
      .eq('chatId', id);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get votes by chat id');
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
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Document')
      .insert({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date().toISOString(),
      })
      .select('*');
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Document')
      .select('*')
      .eq('id', id)
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get documents by id');
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Document')
      .select('*')
      .eq('id', id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get document by id');
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
    const supabase = createServerClient();
    const timestampStr = timestamp.toISOString();
    
    // Delete suggestions first
    await supabase
      .from('Suggestion')
      .delete()
      .eq('documentId', id)
      .gt('documentCreatedAt', timestampStr);
    
    // Delete documents and return them
    const { data, error } = await supabase
      .from('Document')
      .delete()
      .eq('id', id)
      .gt('createdAt', timestampStr)
      .select('*');
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete documents by id after timestamp');
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<{
    id: string;
    documentId: string;
    documentCreatedAt: Date;
    originalText: string;
    suggestedText: string;
    description?: string;
    isResolved: boolean;
    userId: string;
    createdAt: Date;
  }>;
}) {
  try {
    const supabase = createServerClient();
    
    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      documentCreatedAt: suggestion.documentCreatedAt.toISOString(),
      createdAt: suggestion.createdAt.toISOString(),
    }));
    
    const { error } = await supabase
      .from('Suggestion')
      .insert(formattedSuggestions);
    
    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save suggestions');
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Suggestion')
      .select('*')
      .eq('documentId', documentId);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get suggestions by document id');
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Message_v2')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get message by id');
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
    const supabase = createServerClient();
    const timestampStr = timestamp.toISOString();
    
    // Get messages to delete
    const { data: messagesToDelete, error: fetchError } = await supabase
      .from('Message_v2')
      .select('id')
      .eq('chatId', chatId)
      .gte('createdAt', timestampStr);
    
    if (fetchError) throw fetchError;
    
    if (messagesToDelete && messagesToDelete.length > 0) {
      const messageIds = messagesToDelete.map(message => message.id);
      
      // Delete votes for these messages
      await supabase
        .from('Vote_v2')
        .delete()
        .eq('chatId', chatId)
        .in('messageId', messageIds);
      
      // Delete messages
      const { error } = await supabase
        .from('Message_v2')
        .delete()
        .eq('chatId', chatId)
        .in('id', messageIds);
      
      if (error) throw error;
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete messages by chat id after timestamp');
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
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('Chat')
      .update({ visibility })
      .eq('id', chatId);
    
    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update chat visibility by id');
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  context: AppUsage;
}) {
  try {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('Chat')
      .update({ lastContext: context })
      .eq('id', chatId);
    
    if (error) {
      console.warn('Failed to update lastContext for chat', chatId, error);
    }
  } catch (error) {
    console.warn('Failed to update lastContext for chat', chatId, error);
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
    const supabase = createServerClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    ).toISOString();
    
    // First get all chats for the user
    const { data: userChats, error: chatError } = await supabase
      .from('Chat')
      .select('id')
      .eq('userId', id);
    
    if (chatError) throw chatError;
    
    if (!userChats || userChats.length === 0) {
      return 0;
    }
    
    const chatIds = userChats.map(chat => chat.id);
    
    // Then count messages in those chats
    const { count, error } = await supabase
      .from('Message_v2')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('createdAt', twentyFourHoursAgo)
      .in('chatId', chatIds);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to get message count by user id');
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
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('Stream')
      .insert({
        id: streamId,
        chatId,
        createdAt: new Date().toISOString(),
      });
    
    if (error) throw error;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create stream id');
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Stream')
      .select('id')
      .eq('chatId', chatId)
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    
    return data.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get stream ids by chat id');
  }
}
