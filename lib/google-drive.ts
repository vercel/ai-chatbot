import { google } from 'googleapis';
import crypto from 'crypto';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private oauth2Client: any = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required configuration: clientId, clientSecret, or redirectUri');
    }
    console.log('GoogleDriveService initialized with:', {
      redirectUri,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async getAuthUrl(): Promise<{ url: string; codeVerifier: string }> {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Missing required configuration for auth URL generation');
    }

    console.log('Generating auth URL with:', {
      redirectUri: this.redirectUri,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    });

    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        include_granted_scopes: true,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256' as const
      });

      console.log('Generated auth URL:', authUrl);
      return { url: authUrl, codeVerifier };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  async getAccessToken(code: string, codeVerifier: string): Promise<string> {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Missing required configuration for token exchange');
    }

    try {
      console.log('Exchanging code for token with:', {
        redirectUri: this.redirectUri,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        codeLength: code.length
      });

      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      const response = await oauth2Client.getToken({
        code,
        codeVerifier
      });
      
      console.log('Successfully obtained tokens');
      
      this.oauth2Client = oauth2Client;
      oauth2Client.setCredentials(response.tokens);

      return response.tokens.access_token!;
    } catch (error: any) {
      console.error('Error getting access token:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async listFiles(): Promise<GoogleDriveFile[]> {
    if (!this.oauth2Client) {
      throw new Error('Not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, webViewLink)',
    });

    return response.data.files as GoogleDriveFile[];
  }

  async getFileContent(fileId: string): Promise<string> {
    if (!this.oauth2Client) {
      throw new Error('Not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );

    return response.data as string;
  }
} 