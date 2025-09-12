import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getPublicAgents } from '@/lib/db/queries';

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

