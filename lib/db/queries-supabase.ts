// This file contains helper functions to update remaining database queries to use Supabase

import { supabase, shouldUseSupabaseClient } from './supabase';
import { ChatSDKError } from '../errors';

// Helper to update remaining functions - these are the critical ones that need immediate fixing

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    if (shouldUseSupabaseClient()) {
      const twentyFourHoursAgo = new Date(
        Date.now() - differenceInHours * 60 * 60 * 1000,
      );

      const { data, error } = await supabase
        .from('Message')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('createdAt', twentyFourHoursAgo.toISOString())
        .in('chatId', 
          supabase
            .from('Chat')
            .select('id')
            .eq('userId', id)
        );

      if (error) {
        console.error('[getMessageCountByUserId] Supabase error:', error);
        // Return 0 for now to not block usage
        return 0;
      }

      return data || 0;
    }
    
    // Fallback to original implementation is in queries.ts
    return 0;
  } catch (error) {
    console.error('[getMessageCountByUserId] Error:', error);
    return 0; // Don't block usage on error
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<any>;
}) {
  try {
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('Message')
        .insert(messages)
        .select();
      
      if (error) {
        console.error('[saveMessages] Supabase error:', error);
        throw new ChatSDKError('bad_request:database', 'Failed to save messages');
      }
      
      return data;
    }
    
    // Fallback handled in main queries.ts
    throw new Error('Should use main queries.ts for local development');
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('Message')
        .select('*')
        .eq('chatId', id)
        .order('createdAt', { ascending: true });
      
      if (error) {
        console.error('[getMessagesByChatId] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get messages by chat id',
        );
      }
      
      return data || [];
    }
    
    // Fallback handled in main queries.ts
    throw new Error('Should use main queries.ts for local development');
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function getInvitationByToken(token: string) {
  try {
    if (shouldUseSupabaseClient()) {
      const { data, error } = await supabase
        .from('Invitation')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[getInvitationByToken] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to get invitation by token',
        );
      }
      
      return data || undefined;
    }
    
    // Fallback handled in main queries.ts
    throw new Error('Should use main queries.ts for local development');
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get invitation by token',
    );
  }
}

export async function updateInvitationStatus(
  token: string,
  status: 'accepted' | 'expired' | 'revoked',
) {
  try {
    if (shouldUseSupabaseClient()) {
      const updates: any = { status };
      if (status === 'accepted') {
        updates.acceptedAt = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('Invitation')
        .update(updates)
        .eq('token', token)
        .select()
        .single();
      
      if (error) {
        console.error('[updateInvitationStatus] Supabase error:', error);
        throw new ChatSDKError(
          'bad_request:database',
          'Failed to update invitation status',
        );
      }
      
      return data;
    }
    
    // Fallback handled in main queries.ts
    throw new Error('Should use main queries.ts for local development');
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update invitation status',
    );
  }
}