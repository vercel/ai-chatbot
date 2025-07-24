import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build base query
    let baseQuery = supabase
      .from('transcripts')
      .select(
        'id, recording_start, summary, projects, clients, meeting_type, extracted_participants, verified_participant_emails',
      );

    // Only return transcripts where user is a verified participant (applies to all users)
    if (user.email) {
      baseQuery = baseQuery.contains('verified_participant_emails', [
        user.email,
      ]);
    }

    // Get total count for pagination - match main query filtering
    let countQuery = supabase
      .from('transcripts')
      .select('*', { count: 'exact', head: true });

    if (user.email) {
      countQuery = countQuery.contains('verified_participant_emails', [
        user.email,
      ]);
    }

    const { count } = await countQuery;

    // Get paginated results
    const { data, error } = await baseQuery
      .order('recording_start', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
