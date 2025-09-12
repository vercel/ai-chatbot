import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { z } from 'zod/v4';
import {
  getDatabaseUserFromWorkOS,
  updateUserAgentPrompt,
} from '@/lib/db/queries';

const patchBodySchema = z.object({
  customPrompt: z.string().min(0).max(16384),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { agentId: string } },
) {
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
    const body = patchBodySchema.parse(json);

    await updateUserAgentPrompt({
      agentId: params.agentId,
      userId: databaseUser.id,
      customPrompt: body.customPrompt,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API /saved-agents/[agentId] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update custom prompt' },
      { status: 500 },
    );
  }
}

