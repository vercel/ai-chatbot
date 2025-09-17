#!/usr/bin/env ts-node
import 'dotenv/config';

import { Client } from 'pg';
import { z } from 'zod';

const cliSchema = z.object({
  dryRun: z.boolean().default(false),
  verifyOnly: z.boolean().default(false),
});

function parseArgs(): z.infer<typeof cliSchema> {
  const args = process.argv.slice(2);
  const flags = { dryRun: false, verifyOnly: false };

  for (const arg of args) {
    if (arg === '--dry-run') flags.dryRun = true;
    if (arg === '--verify') flags.verifyOnly = true;
  }

  return cliSchema.parse(flags);
}

const SOURCE_URL = process.env.NEON_DATABASE_URL;
const TARGET_URL = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!SOURCE_URL) {
  throw new Error('NEON_DATABASE_URL is required');
}

if (!TARGET_URL) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL is required');
}

interface LegacyUser {
  id: string;
  email: string;
  password: string | null;
}

interface LegacyChat {
  id: string;
  createdAt: string;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
  lastContext: unknown | null;
}

interface LegacyMessage {
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: string;
}

interface LegacyVote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

interface LegacyDocument {
  id: string;
  createdAt: string;
  title: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
}

interface LegacySuggestion {
  id: string;
  documentId: string;
  documentCreatedAt: string;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: string;
}

interface LegacyStream {
  id: string;
  chatId: string;
  createdAt: string;
}

interface MigrationContext {
  source: Client;
  target: Client;
}

function toUserType(email: string): 'GUEST' | 'REGULAR' {
  return email.startsWith('guest-') ? 'GUEST' : 'REGULAR';
}

async function fetchLegacyData({ source }: MigrationContext) {
  const users = (await source.query<LegacyUser>('SELECT * FROM "User"')).rows;
  const chats = (await source.query<LegacyChat>('SELECT * FROM "Chat"')).rows;
  const messages = (await source.query<LegacyMessage>('SELECT * FROM "Message_v2"')).rows;
  const votes = (await source.query<LegacyVote>('SELECT * FROM "Vote_v2"')).rows;
  const documents = (await source.query<LegacyDocument>('SELECT * FROM "Document"')).rows;
  const suggestions = (await source.query<LegacySuggestion>('SELECT * FROM "Suggestion"')).rows;
  const streams = (await source.query<LegacyStream>('SELECT * FROM "Stream"')).rows;

  return { users, chats, messages, votes, documents, suggestions, streams };
}

async function importData(
  { target }: MigrationContext,
  data: Awaited<ReturnType<typeof fetchLegacyData>>,
) {
  const truncateStatements = [
    'TRUNCATE TABLE verification_tokens, sessions, accounts, streams, suggestions, documents, votes, messages, chats, users RESTART IDENTITY CASCADE',
  ];

  for (const statement of truncateStatements) {
    await target.query(statement);
  }

  for (const user of data.users) {
    await target.query(
      `INSERT INTO users (id, email, password, userType, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, userType = EXCLUDED.userType`,
      [user.id, user.email, user.password, toUserType(user.email)],
    );
  }

  for (const chat of data.chats) {
    await target.query(
      `INSERT INTO chats (id, createdAt, title, visibility, lastContext, userId)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        chat.id,
        chat.createdAt,
        chat.title,
        chat.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
        chat.lastContext,
        chat.userId,
      ],
    );
  }

  for (const message of data.messages) {
    await target.query(
      `INSERT INTO messages (id, chatId, role, parts, attachments, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        message.id,
        message.chatId,
        message.role,
        message.parts,
        message.attachments,
        message.createdAt,
      ],
    );
  }

  for (const vote of data.votes) {
    await target.query(
      `INSERT INTO votes (chatId, messageId, isUpvoted)
       VALUES ($1, $2, $3)
       ON CONFLICT (chatId, messageId) DO UPDATE SET isUpvoted = EXCLUDED.isUpvoted`,
      [vote.chatId, vote.messageId, vote.isUpvoted],
    );
  }

  for (const document of data.documents) {
    await target.query(
      `INSERT INTO documents (id, createdAt, title, content, kind, userId)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        document.id,
        document.createdAt,
        document.title,
        document.content,
        document.kind.toUpperCase(),
        document.userId,
      ],
    );
  }

  for (const suggestion of data.suggestions) {
    await target.query(
      `INSERT INTO suggestions (id, documentId, documentCreatedAt, originalText, suggestedText, description, isResolved, userId, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        suggestion.id,
        suggestion.documentId,
        suggestion.documentCreatedAt,
        suggestion.originalText,
        suggestion.suggestedText,
        suggestion.description,
        suggestion.isResolved,
        suggestion.userId,
        suggestion.createdAt,
      ],
    );
  }

  for (const stream of data.streams) {
    await target.query(
      `INSERT INTO streams (id, chatId, createdAt)
       VALUES ($1, $2, $3)`,
      [stream.id, stream.chatId, stream.createdAt],
    );
  }
}

async function verifyMigration(
  { target }: MigrationContext,
  data: Awaited<ReturnType<typeof fetchLegacyData>>,
) {
  const tableCounts: Record<string, number> = {};

  for (const [table, rows] of Object.entries({
    users: data.users,
    chats: data.chats,
    messages: data.messages,
    votes: data.votes,
    documents: data.documents,
    suggestions: data.suggestions,
    streams: data.streams,
  })) {
    const { rows: countRows } = await target.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM ${table}`,
    );

    tableCounts[table] = Number(countRows[0]?.count ?? 0);

    if (tableCounts[table] !== rows.length) {
      throw new Error(
        `Verification failed for ${table}: expected ${rows.length}, got ${tableCounts[table]}`,
      );
    }
  }

  return tableCounts;
}

async function main() {
  const { dryRun, verifyOnly } = parseArgs();

  const source = new Client({ connectionString: SOURCE_URL });
  const target = new Client({ connectionString: TARGET_URL });

  await source.connect();
  await target.connect();

  const context: MigrationContext = { source, target };

  try {
    const data = await fetchLegacyData(context);

    if (dryRun) {
      console.log('[DRY RUN] Counts:', {
        users: data.users.length,
        chats: data.chats.length,
        messages: data.messages.length,
        votes: data.votes.length,
        documents: data.documents.length,
        suggestions: data.suggestions.length,
        streams: data.streams.length,
      });
    }

    if (!dryRun && !verifyOnly) {
      await target.query('BEGIN');
      try {
        await importData(context, data);
        await target.query('COMMIT');
      } catch (error) {
        await target.query('ROLLBACK');
        throw error;
      }
    }

    const counts = await verifyMigration(context, data);
    console.log('Verification successful:', counts);
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error('Migration failed');
  console.error(error);
  process.exit(1);
});
