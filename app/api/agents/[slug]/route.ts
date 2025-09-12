import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getAgentWithUserState, getDatabaseUserFromWorkOS } from '@/lib/db/queries';

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

