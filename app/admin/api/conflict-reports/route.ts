import { auth } from '@/app/(auth)/auth';
import { conflictReport } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['compliance_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const conditions = [];

    if (status) {
      conditions.push(eq(conflictReport.status, status as any));
    }

    if (priority) {
      conditions.push(eq(conflictReport.priority, priority as any));
    }

    const reports = await db
      .select()
      .from(conflictReport)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(conflictReport.priority),
        desc(conflictReport.submittedAt)
      );

    return NextResponse.json(reports);

  } catch (error) {
    console.error('Failed to fetch conflict reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}