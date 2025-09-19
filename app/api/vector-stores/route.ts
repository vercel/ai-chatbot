import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';
import { agent as agentTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';

const OPENAI_BETA_HEADER = { 'OpenAI-Beta': 'assistants=v2' } as const;

export const runtime = 'nodejs';
export const maxDuration = 300;

function pickFiles(formData: FormData) {
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0);

  const vectorStoreId = (
    formData.get('vectorStoreId') ?? undefined
  )?.toString();
  const agentSlug = (formData.get('agentSlug') ?? undefined)?.toString();

  return { files, vectorStoreId, agentSlug };
}

export async function POST(request: Request) {
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
    const formData = await request.formData();
    const { files, vectorStoreId: providedId, agentSlug } = pickFiles(formData);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 },
      );
    }

    const dbUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client, { schema });

    try {
      let agentRecord: typeof agentTable._.inferSelect | null = null;

      if (agentSlug) {
        agentRecord =
          (await db.query.agent.findFirst({
            where: eq(agentTable.slug, agentSlug),
          })) ?? null;

        if (!agentRecord) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 },
          );
        }

        if (agentRecord.userId !== dbUser.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const openai = new OpenAI({ apiKey });

      let vectorStoreId = providedId ?? agentRecord?.vectorStoreId ?? undefined;

      if (!vectorStoreId) {
        const vectorStore = await openai.vectorStores.create(
          {
            name: agentRecord?.name ?? 'Agent Knowledge Base',
            expires_after: {
              anchor: 'last_active_at',
              days: 90,
            },
            metadata: {
              ownerUserId: dbUser.id,
              ...(agentRecord?.id && { agentId: agentRecord.id }),
              ...(agentRecord?.slug && { agentSlug: agentRecord.slug }),
            },
          },
          {
            headers: OPENAI_BETA_HEADER,
          },
        );

        vectorStoreId = vectorStore.id;

        if (agentRecord) {
          await db
            .update(agentTable)
            .set({ vectorStoreId, updatedAt: new Date() })
            .where(eq(agentTable.id, agentRecord.id));
          agentRecord = { ...agentRecord, vectorStoreId };
        }
      } else if (agentRecord && agentRecord.vectorStoreId !== vectorStoreId) {
        await db
          .update(agentTable)
          .set({ vectorStoreId, updatedAt: new Date() })
          .where(eq(agentTable.id, agentRecord.id));
        agentRecord = { ...agentRecord, vectorStoreId };
      }

      if (agentRecord?.id && vectorStoreId) {
        await db
          .update(schema.agentVectorStoreFile)
          .set({ agentId: agentRecord.id, updatedAt: new Date() })
          .where(
            and(
              eq(schema.agentVectorStoreFile.vectorStoreId, vectorStoreId),
              eq(schema.agentVectorStoreFile.userId, dbUser.id),
            ),
          );
      }

      const uploadedSummaries: Array<{
        id: string;
        name: string;
        status: string;
        size: number;
      }> = [];

      for (const file of files) {
        const uploadedFile = await openai.files.create(
          {
            file,
            purpose: 'assistants',
          },
          { headers: OPENAI_BETA_HEADER },
        );

        const vectorStoreFile = await openai.vectorStores.files.createAndPoll(
          vectorStoreId,
          {
            file_id: uploadedFile.id,
            attributes: {
              original_filename: file.name,
              file_size_bytes: file.size,
              mime_type: file.type || 'application/octet-stream',
            },
          },
          {
            headers: OPENAI_BETA_HEADER,
            pollIntervalMs: 2000,
          },
        );

        const attributes =
          (vectorStoreFile.attributes as Record<string, unknown> | null) ??
          null;

        const inferredName =
          (attributes?.original_filename as string | undefined) ?? file.name;

        await db
          .insert(schema.agentVectorStoreFile)
          .values({
            userId: dbUser.id,
            agentId: agentRecord?.id ?? null,
            vectorStoreId,
            vectorStoreFileId: vectorStoreFile.id,
            openAiFileId: uploadedFile.id,
            fileName: inferredName,
            fileSizeBytes: Number(file.size),
            attributes: attributes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.agentVectorStoreFile.vectorStoreFileId,
            set: {
              userId: dbUser.id,
              agentId: agentRecord?.id ?? null,
              vectorStoreId,
              openAiFileId: uploadedFile.id,
              fileName: inferredName,
              fileSizeBytes: Number(file.size),
              attributes: attributes ?? null,
              updatedAt: new Date(),
            },
          });

        uploadedSummaries.push({
          id: vectorStoreFile.id,
          name: inferredName,
          status: vectorStoreFile.status,
          size: file.size,
        });
      }

      return NextResponse.json({
        vectorStoreId,
        uploaded: uploadedSummaries,
      });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('API /vector-stores POST error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files to vector store' },
      { status: 500 },
    );
  }
}
