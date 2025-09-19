import type { AppUsage } from '../usage';
import type { Database } from './database.types';

// Define types based on Supabase database schema
export type User = Database['public']['Tables']['User']['Row'];
export type Chat = Database['public']['Tables']['Chat']['Row'];
export type DBMessage = Database['public']['Tables']['Message_v2']['Row'];
export type Vote = Database['public']['Tables']['Vote_v2']['Row'];
export type Document = Database['public']['Tables']['Document']['Row'];
export type Suggestion = Database['public']['Tables']['Suggestion']['Row'];
export type Stream = Database['public']['Tables']['Stream']['Row'];

// For backward compatibility with the old schema
export type MessageDeprecated = {
  id: string;
  chatId: string;
  role: string;
  content: any;
  createdAt: string;
};

export type VoteDeprecated = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};
