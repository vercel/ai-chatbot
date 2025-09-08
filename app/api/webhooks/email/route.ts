import { NextRequest, NextResponse } from 'next/server';
import { extractReportIdFromEmail } from '@/lib/email/mailgun';
import { conflictReport, reviewResponse } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  console.log('🔔 Mailgun webhook received!', new Date().toISOString());
  try {
    // Mailgun sends data as form data, not JSON
    const formData = await request.formData();
    
    // Extract fields from Mailgun webhook
    const sender = formData.get('sender') as string;
    const recipient = formData.get('recipient') as string; 
    const subject = formData.get('subject') as string;
    const bodyPlain = formData.get('body-plain') as string;
    const bodyHtml = formData.get('body-html') as string;
    const messageId = formData.get('Message-Id') as string;
    const timestamp = formData.get('timestamp') as string;
    const token = formData.get('token') as string;
    const signature = formData.get('signature') as string;

    console.log('Mailgun webhook data:', {
      sender,
      recipient,
      subject,
      messageId,
    });

    // Verify webhook signature (recommended for production)
    // TODO: Implement Mailgun signature verification
    
    // Extract report ID from the recipient email address
    const reportId = extractReportIdFromEmail(recipient);

    if (!reportId) {
      console.log('No valid report ID found in recipient:', recipient);
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
    if (sender.toLowerCase() !== report.userEmail.toLowerCase()) {
      console.log(`Email from unauthorized sender: ${sender} vs ${report.userEmail}`);
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    // Extract the email content (prefer plain text over HTML)
    let emailContent = bodyPlain || '';
    
    // If no plain text content, try to extract from HTML
    if (!emailContent && bodyHtml) {
      // Basic HTML to text conversion
      emailContent = bodyHtml
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }

    // Clean up quoted content (remove previous email thread)
    const lines = emailContent.split('\n');
    const cleanLines: string[] = [];
    
    for (const line of lines) {
      // Stop at common reply markers
      if (line.match(/^On .* wrote:$/) || 
          line.match(/^From:/) || 
          line.startsWith('>') ||
          line.includes('This is an automated message') ||
          line.includes('Checky - Ethics & Compliance')) {
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
      emailId: messageId,
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