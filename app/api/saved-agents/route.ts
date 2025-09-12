import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { z } from 'zod/v4';
import {
  getDatabaseUserFromWorkOS,
  getSavedAgentsByUserId,
  saveAgentForUser,
  unsaveAgentForUser,
} from '@/lib/db/queries';

const postBodySchema = z.object({
  agentId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const rows = await getSavedAgentsByUserId({
      userId: databaseUser.id,
      limit,
      offset,
    });

    // No count here for now; can be added later
    return NextResponse.json({ data: rows, pagination: { page, limit } });
  } catch (error) {
    console.error('API /saved-agents GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved agents' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const json = await request.json();
    const body = postBodySchema.parse(json);

    await saveAgentForUser({
      userId: databaseUser.id,
      agentId: body.agentId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API /saved-agents POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save agent' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const json = await request.json();
    const body = postBodySchema.parse(json);

    await unsaveAgentForUser({
      userId: databaseUser.id,
      agentId: body.agentId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API /saved-agents DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to unsave agent' },
      { status: 500 },
    );
  }
}

