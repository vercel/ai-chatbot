// pages/api/googleDriveAuth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  
);

// Redirect user to Google OAuth consent screen
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    res.redirect(authUrl);
  } else if (req.method === 'POST') {
    const { code } = req.body;

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Store the access token in a secure way (e.g., HTTP-only cookies, or DB)
      res.status(200).json({ message: 'Authentication successful', tokens });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get tokens' });
    }
  }
}
