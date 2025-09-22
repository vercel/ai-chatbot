import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getPublicAgents, getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { agent } from '@/lib/db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema });

const createAgentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  agentPrompt: z
    .string()
    .max(100000, 'Agent prompt must be less than 100000 characters')
    .optional(),
  isPublic: z.boolean().default(true),
  vectorStoreId: z
    .string()
    .max(128, 'Vector store ID must be less than 128 characters')
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Auth is enforced by middleware; still call to ensure session resolution
    await withAuth();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const { data, total } = await getPublicAgents({ q, limit, offset });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('API /agents error:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth({ ensureSignedIn: true });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAgentSchema.parse(body);

    // Auto-generate slug from name
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug is unique by adding a suffix if needed
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingAgent = await db.query.agent.findFirst({
        where: eq(agent.slug, slug),
      });

      if (!existingAgent) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get or create the database user via WorkOS mapping
    const dbUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create the agent
    const [newAgent] = await db
      .insert(agent)
      .values({
        name: validatedData.name,
        slug,
        userId: dbUser.id,
        description: validatedData.description || null,
        agentPrompt: validatedData.agentPrompt || null,
        modelId: null,
        isPublic: validatedData.isPublic,
        vectorStoreId: validatedData.vectorStoreId || null,
      })
      .returning();

    if (validatedData.vectorStoreId) {
      await db
        .update(schema.agentVectorStoreFile)
        .set({ agentId: newAgent.id, updatedAt: new Date() })
        .where(
          and(
            eq(
              schema.agentVectorStoreFile.vectorStoreId,
              validatedData.vectorStoreId,
            ),
            eq(schema.agentVectorStoreFile.userId, dbUser.id),
          ),
        );
    }

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
