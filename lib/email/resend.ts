import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const CHECKY_EMAIL = process.env.CHECKY_FROM_EMAIL || 'checky@app.growingproducts.io';
export const CHECKY_DOMAIN = process.env.CHECKY_DOMAIN || 'app.growingproducts.io';

// Generate unique email addresses for threading
export const generateReplyToEmail = (reportId: string) => {
  return `report-${reportId}@${CHECKY_DOMAIN}`;
};

// Extract report ID from reply-to email
export const extractReportIdFromEmail = (email: string): string | null => {
  const match = email.match(/^report-([a-f0-9-]+)@/);
  return match ? match[1] : null;
};