import * as React from 'react';

interface ConflictReportEmailProps {
  reportId: string;
  userEmail: string;
  actionType: 'acknowledge' | 'request_more_info' | 'approve' | 'reject';
  responseContent: string;
  reviewerEmail: string;
  replyToEmail: string;
}

export const ConflictReportEmail: React.FC<ConflictReportEmailProps> = ({
  reportId,
  userEmail,
  actionType,
  responseContent,
  reviewerEmail,
  replyToEmail,
}) => {
  const getSubject = () => {
    switch (actionType) {
      case 'acknowledge':
      case 'approve':
        return `✅ Your Conflict Report #${reportId.slice(0, 8)} has been Approved`;
      case 'request_more_info':
        return `📋 Additional Information Needed - Report #${reportId.slice(0, 8)}`;
      case 'reject':
        return `❌ Your Conflict Report #${reportId.slice(0, 8)} Status Update`;
      default:
        return `📄 Update on Your Conflict Report #${reportId.slice(0, 8)}`;
    }
  };

  const getHeaderColor = () => {
    switch (actionType) {
      case 'approve':
      case 'acknowledge':
        return '#10B981'; // Green
      case 'request_more_info':
        return '#F59E0B'; // Yellow
      case 'reject':
        return '#EF4444'; // Red
      default:
        return '#3B82F6'; // Blue
    }
  };

  return (
    <html>
      <head>
        <title>{getSubject()}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          {/* Header */}
          <div style={{ 
            backgroundColor: getHeaderColor(), 
            color: 'white', 
            padding: '20px', 
            borderRadius: '8px 8px 0 0',
            textAlign: 'center' 
          }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Checky - Ethics & Compliance</h1>
            <p style={{ margin: '10px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
              Conflict of Interest Report Update
            </p>
          </div>

          {/* Content */}
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '30px', 
            borderRadius: '0 0 8px 8px',
            border: '1px solid #e5e7eb' 
          }}>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Report ID:</strong> #{reportId.slice(0, 8)}</p>
              <p><strong>Status:</strong> {actionType.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Reviewed by:</strong> {reviewerEmail}</p>
            </div>

            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, color: '#1f2937' }}>Message from Compliance Team:</h3>
              <div style={{ whiteSpace: 'pre-wrap' }}>{responseContent}</div>
            </div>

            {actionType === 'request_more_info' && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>
                  📧 How to Respond:
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                  <strong>Reply directly to this email</strong> with the requested information. 
                  Your response will be automatically added to your conflict report thread.
                </p>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
            
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <p>
                <strong>Need help?</strong> Contact Ethics & Compliance at{' '}
                <a href={`mailto:compliance@${replyToEmail.split('@')[1]}`} style={{ color: getHeaderColor() }}>
                  compliance@{replyToEmail.split('@')[1]}
                </a>
              </p>
              <p style={{ marginTop: '15px' }}>
                This is an automated message from Checky Compliance System. 
                {actionType === 'request_more_info' && ' You can reply directly to this email.'}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export const generateEmailProps = (
  reportId: string,
  userEmail: string,
  actionType: 'acknowledge' | 'request_more_info' | 'approve' | 'reject',
  responseContent: string,
  reviewerEmail: string,
  replyToEmail: string
): ConflictReportEmailProps => ({
  reportId,
  userEmail,
  actionType,
  responseContent,
  reviewerEmail,
  replyToEmail,
});

// Helper to generate the plain text version
export const generatePlainTextEmail = (props: ConflictReportEmailProps): string => {
  const { reportId, actionType, responseContent, reviewerEmail, replyToEmail } = props;
  
  return `
CHECKY - ETHICS & COMPLIANCE
Conflict of Interest Report Update

Report ID: #${reportId.slice(0, 8)}
Status: ${actionType.replace('_', ' ').toUpperCase()}
Reviewed by: ${reviewerEmail}

Message from Compliance Team:
${responseContent}

${actionType === 'request_more_info' ? `
HOW TO RESPOND:
Reply directly to this email with the requested information. 
Your response will be automatically added to your conflict report thread.
` : ''}

Need help? Contact Ethics & Compliance at compliance@${replyToEmail.split('@')[1]}

This is an automated message from Checky Compliance System.
${actionType === 'request_more_info' ? 'You can reply directly to this email.' : ''}
  `.trim();
};

// Generate HTML email content as pure string (avoiding React SSR issues)
export const generateEmailHtml = (props: ConflictReportEmailProps): string => {
  const { reportId, actionType, responseContent, reviewerEmail, replyToEmail } = props;
  
  const getSubject = () => {
    switch (actionType) {
      case 'acknowledge':
      case 'approve':
        return `✅ Your Conflict Report #${reportId.slice(0, 8)} has been Approved`;
      case 'request_more_info':
        return `📋 Additional Information Needed - Report #${reportId.slice(0, 8)}`;
      case 'reject':
        return `❌ Your Conflict Report #${reportId.slice(0, 8)} Status Update`;
      default:
        return `📄 Update on Your Conflict Report #${reportId.slice(0, 8)}`;
    }
  };

  const getHeaderColor = () => {
    switch (actionType) {
      case 'approve':
      case 'acknowledge':
        return '#10B981'; // Green
      case 'request_more_info':
        return '#F59E0B'; // Yellow
      case 'reject':
        return '#EF4444'; // Red
      default:
        return '#3B82F6'; // Blue
    }
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${getSubject()}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="background-color: ${getHeaderColor()}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Checky - Ethics & Compliance</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          Conflict of Interest Report Update
        </p>
      </div>

      <!-- Content -->
      <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 20px;">
          <p><strong>Report ID:</strong> #${reportId.slice(0, 8)}</p>
          <p><strong>Status:</strong> ${actionType.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Reviewed by:</strong> ${reviewerEmail}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1f2937;">Message from Compliance Team:</h3>
          <div style="white-space: pre-wrap;">${responseContent}</div>
        </div>

        ${actionType === 'request_more_info' ? `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">
            📧 How to Respond:
          </h4>
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Reply directly to this email</strong> with the requested information. 
            Your response will be automatically added to your conflict report thread.
          </p>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <div style="font-size: 12px; color: #6b7280;">
          <p>
            <strong>Need help?</strong> Contact Ethics & Compliance at 
            <a href="mailto:compliance@${replyToEmail.split('@')[1]}" style="color: ${getHeaderColor()};">
              compliance@${replyToEmail.split('@')[1]}
            </a>
          </p>
          <p style="margin-top: 15px;">
            This is an automated message from Checky Compliance System. 
            ${actionType === 'request_more_info' ? 'You can reply directly to this email.' : ''}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();
};