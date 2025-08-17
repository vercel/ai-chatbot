import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendInvitationEmailProps {
  to: string;
  inviteUrl: string;
  inviterName?: string;
  expiresAt: Date;
}

export async function sendInvitationEmail({
  to,
  inviteUrl,
  inviterName = 'Measurelab',
  expiresAt,
}: SendInvitationEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - invitation email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.EMAIL_FROM) {
    console.warn('EMAIL_FROM not configured - invitation email not sent');
    return { success: false, error: 'Email sender not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: 'You\'re invited to Brian by Measurelab',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>You're invited to Brian</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 20px 0;
                border-bottom: 1px solid #eee;
              }
              .logo {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
              }
              .logo .measure { color: #333; }
              .logo .lab { color: #0066cc; }
              .cta-button {
                display: inline-block;
                background-color: #0066cc;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
              }
              .expires {
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">
                <span class="measure">measure</span><span class="lab">lab</span>
              </div>
              <p>AI Assistant Platform</p>
            </div>
            
            <h1>You're invited to Brian!</h1>
            
            <p>Hello!</p>
            
            <p>${inviterName} has invited you to join <strong>Brian</strong>, Measurelab's AI assistant platform. Brian provides access to cutting-edge AI models for conversations, code generation, and content creation.</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="expires">
              <strong>⏰ This invitation expires on:</strong><br>
              ${expiresAt.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <p>What you'll get access to:</p>
            <ul>
              <li>🤖 Multiple AI models including Claude, GPT, and Gemini</li>
              <li>📄 Artifact creation for code, documents, and content</li>
              <li>💬 Advanced conversational AI capabilities</li>
              <li>🔒 Secure, private conversations</li>
            </ul>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>This invitation link is single-use and will expire after the date shown above.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}