import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { agent, chat } from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';
import { z } from 'zod';

const updateAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  agentPrompt: z.string().optional(),
  isPublic: z.boolean(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await withAuth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databaseUser = await getDatabaseUserFromWorkOS({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? undefined,
      lastName: session.user.lastName ?? undefined,
    });

    if (!databaseUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client, { schema });

    const result = await db.query.agent.findFirst({
      where: eq(agent.slug, slug),
    });

    await client.end();

    if (!result) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user owns this agent (for edit access)
    if (result.userId !== databaseUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ agent: result });
  } catch (error) {
    console.error('API /agents/[slug] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { user } = await withAuth({ ensureSignedIn: true });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateAgentSchema.parse(body);

    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client, { schema });

    // Get database user
    const dbUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });

    if (!dbUser) {
      await client.end();
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Find the agent
    const existingAgent = await db.query.agent.findFirst({
      where: eq(agent.slug, slug),
    });

    if (!existingAgent) {
      await client.end();
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check ownership
    if (existingAgent.userId !== dbUser.id) {
      await client.end();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the agent
    const [updatedAgent] = await db
      .update(agent)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        agentPrompt: validatedData.agentPrompt || null,
        isPublic: validatedData.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(agent.id, existingAgent.id))
      .returning();

    await client.end();
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('API /agents/[slug] PATCH error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const { user } = await withAuth({ ensureSignedIn: true });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client, { schema });

    // Resolve database user (ensures presence in our DB)
    const dbUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });

    if (!dbUser) {
      await client.end();
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Load the agent by slug
    const selectedAgent = await db.query.agent.findFirst({
      where: eq(agent.slug, slug),
    });

    if (!selectedAgent) {
      await client.end();
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Ownership check
    if (!selectedAgent.userId || selectedAgent.userId !== dbUser.id) {
      await client.end();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Null out chat references to this agent to satisfy FK
    await db
      .update(chat)
      .set({ agentId: null })
      .where(eq(chat.agentId, selectedAgent.id));

    // Delete the agent (UserAgent rows are cascaded)
    await db.delete(agent).where(eq(agent.id, selectedAgent.id));

    await client.end();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('API /agents/[slug] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 },
    );
  }
}
