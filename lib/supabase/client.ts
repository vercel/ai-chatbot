import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Default Supabase URL and key - these should be overridden by environment variables
const defaultSupabaseUrl = 'https://abcd.com';
const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXsfsd4325tdzZSIsInJlZiI6ImRnaXfds2YmhsY3ZwIiwicm9sZSI6ImFub24iLCJpYXQivsvzgwNzMsImV4cCI6MjA3MjM1NDA3M30.Sxt1dNztlwwSdYaepYM4NPqv1qsds1ur_dpf7I';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseKey
);

// Create a server-side client (for use in server components, API routes, etc.)
export const createServerClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
};
