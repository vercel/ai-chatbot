import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import OpenAI from 'openai';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { agent as agentTable } from '@/lib/db/schema';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const maxDuration = 30;

const OPENAI_BETA_HEADER = { 'OpenAI-Beta': 'assistants=v2' } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vectorStoreId: string }> },
) {
  const apiKey =
    process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY ?? '';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key configuration' },
      { status: 500 },
    );
  }

  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { vectorStoreId } = await params;

    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client, { schema });

    try {
      const dbUser = await getDatabaseUserFromWorkOS({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }

      const openai = new OpenAI({ apiKey });

      const vectorStore = await openai.vectorStores.retrieve(vectorStoreId, {
        headers: OPENAI_BETA_HEADER,
      });

      if (!vectorStore) {
        return NextResponse.json(
          { error: 'Vector store not found' },
          { status: 404 },
        );
      }

      // Verify ownership via metadata or database linkage
      const ownerUserId =
        typeof vectorStore.metadata === 'object'
          ? (vectorStore.metadata as Record<string, unknown>).ownerUserId
          : undefined;

      const [agentRecord] = await db
        .select()
        .from(agentTable)
        .where(eq(agentTable.vectorStoreId, vectorStoreId))
        .limit(1);

      if (
        ownerUserId &&
        ownerUserId !== dbUser.id &&
        (!agentRecord || agentRecord.userId !== dbUser.id)
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (agentRecord && agentRecord.userId !== dbUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const files: Array<{
        id: string;
        name: string;
        status: string;
        usage_bytes: number;
        size?: number;
        created_at?: number;
        attributes?: Record<string, unknown> | null;
      }> = [];

      const dbFileRows = await db
        .select()
        .from(schema.agentVectorStoreFile)
        .where(
          and(
            eq(schema.agentVectorStoreFile.vectorStoreId, vectorStoreId),
            eq(schema.agentVectorStoreFile.userId, dbUser.id),
          ),
        );

      const dbFileMap = new Map(
        dbFileRows.map((row) => [row.vectorStoreFileId, row]),
      );

      const fileIterator = openai.vectorStores.files.list(
        vectorStoreId,
        { limit: 50 },
        { headers: OPENAI_BETA_HEADER },
      );

      for await (const file of fileIterator) {
        const attributes =
          (file.attributes as Record<string, unknown> | null) ?? null;
        const inferredName =
          (attributes?.original_filename as string | undefined) ||
          (attributes?.filename as string | undefined) ||
          file.id;

        files.push({
          id: file.id,
          name: dbFileMap.get(file.id)?.fileName ?? inferredName ?? file.id,
          status: file.status,
          usage_bytes: file.usage_bytes ?? 0,
          size:
            dbFileMap.get(file.id)?.fileSizeBytes ??
            file.usage_bytes ??
            undefined,
          created_at: file.created_at,
          attributes,
        });
      }

      return NextResponse.json({ vectorStore, files });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('API /vector-stores/[id] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve vector store files' },
      { status: 500 },
    );
  }
}
