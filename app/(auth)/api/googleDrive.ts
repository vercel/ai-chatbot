// pages/api/googleDrive.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
   
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Retrieve the token from the request headers (ensure token is securely passed)
      const token = req.headers.authorization;

      if (!token) {
        return res.status(400).json({ error: 'Authorization token is missing' });
      }

      oauth2Client.setCredentials({ access_token: token });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // List files from Google Drive
      const fileList = await drive.files.list();
      res.status(200).json(fileList.data.files);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching files from Google Drive' });
    }
  }
}
