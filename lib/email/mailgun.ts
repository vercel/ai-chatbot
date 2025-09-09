import Mailgun from 'mailgun.js';
import FormData from 'form-data';

if (!process.env.MAILGUN_API_KEY) {
  throw new Error('MAILGUN_API_KEY environment variable is not set');
}

if (!process.env.MAILGUN_DOMAIN) {
  throw new Error('MAILGUN_DOMAIN environment variable is not set');
}

const mailgun = new Mailgun(FormData);
export const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_URL || 'https://api.mailgun.net', // Use EU endpoint if needed: https://api.eu.mailgun.net
});

export const CHECKY_EMAIL = process.env.CHECKY_FROM_EMAIL || 'checky@mg.growingproducts.io';
export const CHECKY_DOMAIN = process.env.CHECKY_DOMAIN || 'mg.growingproducts.io';
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

// Generate unique email addresses for threading
export const generateReplyToEmail = (reportId: string) => {
  return `report-${reportId}@${MAILGUN_DOMAIN}`;
};

// Extract report ID from reply-to email
export const extractReportIdFromEmail = (email: string): string | null => {
  const match = email.match(/^report-([a-f0-9-]+)@/);
  return match ? match[1] : null;
};