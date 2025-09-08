import { resend, CHECKY_EMAIL, generateReplyToEmail } from './resend';
import { generateEmailProps, generatePlainTextEmail, generateEmailHtml } from './templates';
import type { ConflictReport } from '@/lib/db/schema';

interface SendReviewEmailParams {
  report: ConflictReport;
  actionType: 'acknowledge' | 'request_more_info' | 'approve' | 'reject';
  responseContent: string;
  reviewerEmail: string;
}

export async function sendReviewEmail({
  report,
  actionType,
  responseContent,
  reviewerEmail,
}: SendReviewEmailParams) {
  const replyToEmail = generateReplyToEmail(report.id);
  
  const emailProps = generateEmailProps(
    report.id,
    report.userEmail,
    actionType,
    responseContent,
    reviewerEmail,
    replyToEmail
  );

  // Generate subject line
  const getSubject = () => {
    switch (actionType) {
      case 'acknowledge':
      case 'approve':
        return `✅ Your Conflict Report #${report.id.slice(0, 8)} has been Approved`;
      case 'request_more_info':
        return `📋 Additional Information Needed - Report #${report.id.slice(0, 8)}`;
      case 'reject':
        return `❌ Your Conflict Report #${report.id.slice(0, 8)} Status Update`;
      default:
        return `📄 Update on Your Conflict Report #${report.id.slice(0, 8)}`;
    }
  };

  try {
    const emailData = await resend.emails.send({
      from: CHECKY_EMAIL,
      to: [report.userEmail],
      replyTo: replyToEmail, // This enables email threading
      subject: getSubject(),
      html: generateEmailHtml(emailProps),
      text: generatePlainTextEmail(emailProps),
      // Add headers for email threading
      headers: {
        'Message-ID': `<report-${report.id}-${Date.now()}@${replyToEmail.split('@')[1]}>`,
        'References': report.emailThreadId ? `<${report.emailThreadId}>` : undefined,
        'In-Reply-To': report.emailThreadId ? `<${report.emailThreadId}>` : undefined,
      },
    });

    console.log('Email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Failed to send review email:', error);
    throw error;
  }
}

// Send initial confirmation email when report is submitted
export async function sendReportSubmissionEmail(report: ConflictReport) {
  const replyToEmail = generateReplyToEmail(report.id);
  
  try {
    const emailData = await resend.emails.send({
      from: CHECKY_EMAIL,
      to: [report.userEmail],
      replyTo: replyToEmail,
      subject: `📋 Conflict Report Submitted - #${report.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Checky - Ethics & Compliance</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Report Submitted Successfully</p>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p><strong>Report ID:</strong> #${report.id.slice(0, 8)}</p>
            <p><strong>Status:</strong> PENDING REVIEW</p>
            <p><strong>Submitted:</strong> ${report.submittedAt.toLocaleDateString()}</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What happens next?</h3>
              <ul style="color: #4b5563;">
                <li>Your report will be reviewed by our compliance team</li>
                <li>You'll receive email updates as your report is processed</li>
                <li>If additional information is needed, you can reply directly to our emails</li>
              </ul>
            </div>
            
            <div style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              <p>Need help? Contact Ethics & Compliance at compliance@${replyToEmail.split('@')[1]}</p>
              <p>This is an automated message from Checky Compliance System.</p>
            </div>
          </div>
        </div>
      `,
      text: `
CHECKY - ETHICS & COMPLIANCE
Report Submitted Successfully

Report ID: #${report.id.slice(0, 8)}
Status: PENDING REVIEW
Submitted: ${report.submittedAt.toLocaleDateString()}

What happens next?
- Your report will be reviewed by our compliance team
- You'll receive email updates as your report is processed
- If additional information is needed, you can reply directly to our emails

Need help? Contact Ethics & Compliance at compliance@${replyToEmail.split('@')[1]}
      `.trim(),
      headers: {
        'Message-ID': `<report-${report.id}-initial@${replyToEmail.split('@')[1]}>`,
      },
    });

    console.log('Submission confirmation email sent:', emailData);
    return emailData;
  } catch (error) {
    console.error('Failed to send submission confirmation email:', error);
    throw error;
  }
}