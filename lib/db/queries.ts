import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
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
  vote,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

// Add debug logging
function debugConnection() {
  try {
    console.log('Database connection debug:');
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    
    if (process.env.POSTGRES_URL) {
      // Safe logging of DB URL (hiding password)
      const url = new URL(process.env.POSTGRES_URL);
      console.log('Host:', url.hostname);
      console.log('Port:', url.port || '5432 (default)');
      console.log('Database:', url.pathname.replace('/', ''));
      console.log('Username:', url.username);
      console.log('Password:', url.password ? '******' : 'not set');
    }
    
    console.log('Vercel deployment:', !!process.env.VERCEL);
    console.log('Node environment:', process.env.NODE_ENV);
  } catch (error) {
    console.error('Error in debug logging:', error);
  }
}

// Run debug
debugConnection();

// Configure database connection with options
const connectionOptions = {
  ssl: true, // Enable SSL
  max: 10, // Connection pool max size
  idle_timeout: 20, // Timeout for idle connections
  connect_timeout: 10 // Timeout for connection attempts
};

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, connectionOptions);
const db = drizzle(client);

// Export functions remain unchanged
// ...rest of your file...