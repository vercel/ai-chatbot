import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getAgentWithUserState, getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { agent, chat } from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';

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

    const result = await getAgentWithUserState({
      slug,
      userId: databaseUser.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API /agents/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
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

