import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const transcriptId = Number.parseInt(id);
    if (Number.isNaN(transcriptId)) {
      return NextResponse.json(
        { error: 'Invalid transcript ID' },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('transcripts')
      .select('id, transcript_content, verified_participant_emails')
      .eq('id', transcriptId);

    // Only return transcripts where user is a verified participant (applies to all users)
    if (user.email) {
      query = query.contains('verified_participant_emails', [user.email]);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transcript not found or access denied' },
          { status: 404 },
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Transcript not found or access denied' },
        { status: 404 },
      );
    }

    // Extract cleaned content from transcript_content JSON
    const cleanedContent = data.transcript_content?.cleaned || null;

    return NextResponse.json({
      id: data.id,
      content: cleanedContent,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
