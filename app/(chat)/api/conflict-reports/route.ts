import { auth } from '@/app/(auth)/auth';
import { conflictReport } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { sendReportSubmissionEmail } from '@/lib/email/service';
import { db } from '@/lib/db';

const submitReportSchema = z.object({
  documentId: z.string().uuid(),
  content: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentId, content, priority } = submitReportSchema.parse(body);

    const [newReport] = await db.insert(conflictReport).values({
      userEmail: session.user.email,
      documentId,
      content,
      priority: priority || 'medium',
      submittedAt: new Date(),
      organizationId: session.user.organizationId,
    }).returning();

    // Send initial confirmation email to the user
    try {
      await sendReportSubmissionEmail(newReport);
      console.log(`Confirmation email sent for report ${newReport.id}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      reportId: newReport.id,
      message: 'Conflict report submitted successfully for review'
    });

  } catch (error) {
    console.error('Failed to submit conflict report:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userReports = await db
      .select()
      .from(conflictReport)
      .where(and(
        eq(conflictReport.userEmail, session.user.email),
        eq(conflictReport.organizationId, session.user.organizationId)
      ))
      .orderBy(desc(conflictReport.submittedAt));

    return NextResponse.json(userReports);

  } catch (error) {
    console.error('Failed to fetch conflict reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}