import { NextRequest, NextResponse } from 'next/server';
import { extractReportIdFromEmail } from '@/lib/email/resend';
import { conflictReport, reviewResponse } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

interface ResendWebhookPayload {
  type: 'email.received';
  created_at: string;
  data: {
    message_id: string;
    from: {
      email: string;
      name?: string;
    };
    to: Array<{
      email: string;
      name?: string;
    }>;
    subject: string;
    text?: string;
    html?: string;
    reply_to?: {
      email: string;
      name?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook signature (recommended for production)
    // const signature = request.headers.get('resend-signature');
    // if (!signature) {
    //   return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    // }

    const payload: ResendWebhookPayload = await request.json();
    
    // Only process email received events
    if (payload.type !== 'email.received') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const { data } = payload;
    
    // Extract report ID from the email address
    let reportId: string | null = null;
    
    // Check the 'to' field for our reply-to address
    for (const recipient of data.to) {
      const extractedId = extractReportIdFromEmail(recipient.email);
      if (extractedId) {
        reportId = extractedId;
        break;
      }
    }

    if (!reportId) {
      console.log('No valid report ID found in email recipients');
      return NextResponse.json({ message: 'No valid report ID found' });
    }

    // Find the conflict report
    const [report] = await db
      .select()
      .from(conflictReport)
      .where(eq(conflictReport.id, reportId));

    if (!report) {
      console.log(`Report not found: ${reportId}`);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify the email is from the report user
    if (data.from.email.toLowerCase() !== report.userEmail.toLowerCase()) {
      console.log(`Email from unauthorized sender: ${data.from.email} vs ${report.userEmail}`);
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    // Extract the email content (prefer text over HTML for simplicity)
    let emailContent = data.text || '';
    
    // If no text content, try to extract from HTML
    if (!emailContent && data.html) {
      // Basic HTML to text conversion (you might want to use a proper library)
      emailContent = data.html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }

    // Clean up quoted content (remove previous email thread)
    // This is a basic implementation - you might want more sophisticated parsing
    const lines = emailContent.split('\n');
    const cleanLines: string[] = [];
    
    for (const line of lines) {
      // Stop at common reply markers
      if (line.match(/^On .* wrote:$/) || 
          line.match(/^From:/) || 
          line.startsWith('>') ||
          line.includes('This is an automated message')) {
        break;
      }
      cleanLines.push(line);
    }
    
    const cleanContent = cleanLines.join('\n').trim();

    if (!cleanContent) {
      console.log('No usable content found in email');
      return NextResponse.json({ error: 'No content found' }, { status: 400 });
    }

    // Add the user's response to the database
    const [newResponse] = await db.insert(reviewResponse).values({
      conflictReportId: reportId,
      reviewerId: null, // User response, no reviewer
      actionType: 'user_response',
      responseContent: cleanContent,
      createdAt: new Date(),
      emailId: data.message_id,
      isFromUser: true,
    }).returning();

    // Update report status to under_review if it was requires_more_info
    if (report.status === 'requires_more_info') {
      await db
        .update(conflictReport)
        .set({ status: 'under_review' })
        .where(eq(conflictReport.id, reportId));
    }

    console.log(`User response added to report ${reportId}:`, newResponse.id);

    return NextResponse.json({ 
      success: true, 
      message: 'User response processed successfully',
      responseId: newResponse.id
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle webhook verification for Resend
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({ message: 'Webhook endpoint active' });
}