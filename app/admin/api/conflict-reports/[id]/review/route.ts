import { auth } from '@/app/(auth)/auth';
import { conflictReport, reviewResponse } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendReviewEmail } from '@/lib/email/service';
import { db } from '@/lib/db';

const reviewResponseSchema = z.object({
  actionType: z.enum(['acknowledge', 'request_more_info', 'approve', 'reject']),
  responseContent: z.string().min(1),
  updateStatus: z.enum(['pending', 'under_review', 'requires_more_info', 'approved', 'rejected']).optional(),
});

export async function POST(
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
    const { actionType, responseContent, updateStatus } = reviewResponseSchema.parse(body);

    // Check if the report exists
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

    // Create the review response
    const [newResponse] = await db.insert(reviewResponse).values({
      conflictReportId: id,
      reviewerId: session.user.id,
      actionType,
      responseContent,
      createdAt: new Date(),
    }).returning();

    // Update the report status if specified
    let updatedReport = report;
    if (updateStatus) {
      const updateData: any = { 
        status: updateStatus,
        reviewerId: session.user.id,
      };

      if (['approved', 'rejected'].includes(updateStatus)) {
        updateData.reviewedAt = new Date();
      }

      const [updated] = await db
        .update(conflictReport)
        .set(updateData)
        .where(eq(conflictReport.id, id))
        .returning();
      
      updatedReport = updated;
    }

    // Send email notification to the user
    try {
      await sendReviewEmail({
        report: updatedReport,
        actionType,
        responseContent,
        reviewerEmail: session.user.email || 'unknown@example.com',
      });
      console.log(`Email sent for report ${id} with action ${actionType}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the entire request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      responseId: newResponse.id,
      message: 'Review response submitted successfully'
    });

  } catch (error) {
    console.error('Failed to submit review response:', error);
    
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

    const responses = await db
      .select()
      .from(reviewResponse)
      .where(eq(reviewResponse.conflictReportId, id))
      .orderBy(reviewResponse.createdAt);

    return NextResponse.json(responses);

  } catch (error) {
    console.error('Failed to fetch review responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}