import { auth } from '@/app/(auth)/auth';
import { conflictReport } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';

const updateReportSchema = z.object({
  status: z.enum(['pending', 'under_review', 'requires_more_info', 'approved', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  reviewerId: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user || !['compliance_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const [report] = await db
      .select()
      .from(conflictReport)
      .where(eq(conflictReport.id, id));

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Failed to fetch conflict report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user || !['compliance_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = updateReportSchema.parse(body);

    const updateData: any = { ...updates };

    if (updates.status && ['approved', 'rejected'].includes(updates.status)) {
      updateData.reviewedAt = new Date();
      updateData.reviewerId = session.user.id;
    }

    const [updatedReport] = await db
      .update(conflictReport)
      .set(updateData)
      .where(eq(conflictReport.id, id))
      .returning();

    if (!updatedReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: 'Report updated successfully'
    });

  } catch (error) {
    console.error('Failed to update conflict report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}