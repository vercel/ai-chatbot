import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export interface GCPConfig {
  apiKey: string;
  projectId?: string;
  region?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export class GoogleCloudService {
  private auth: GoogleAuth;
  private config: GCPConfig;
  private clients: Map<string, any> = new Map();

  constructor(config: GCPConfig) {
    this.config = config;
    this.auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentials: config.credentials,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/maps-platform',
        'https://www.googleapis.com/auth/bigquery',
        'https://www.googleapis.com/auth/generative-language',
        'https://www.googleapis.com/auth/solar',
      ],
    });
  }

  /**
   * Get authenticated client for a specific Google API
   */
  async getClient(apiName: string): Promise<any> {
    if (this.clients.has(apiName)) {
      return this.clients.get(apiName);
    }

    let client: any;

    switch (apiName) {
      case 'maps':
        client = google.maps({
          version: 'v1',
          auth: this.auth,
        });
        break;

      case 'bigquery':
        client = google.bigquery({
          version: 'v2',
          auth: this.auth,
        });
        break;

      case 'vertexai':
        client = google.aiplatform({
          version: 'v1',
          auth: this.auth,
        });
        break;

      case 'generativelanguage':
        client = google.generativelanguage({
          version: 'v1beta',
          auth: this.auth,
        });
        break;

      case 'solar':
        client = google.solar({
          version: 'v1',
          auth: this.auth,
        });
        break;

      default:
        throw new Error(`Unsupported API: ${apiName}`);
    }

    this.clients.set(apiName, client);
    return client;
  }

  /**
   * Make authenticated request to Google API
   */
  async makeRequest(apiName: string, method: string, params: any = {}): Promise<any> {
    try {
      const client = await this.getClient(apiName);
      const [response] = await client[method](params);
      return response;
    } catch (error) {
      console.error(`GCP API Error (${apiName}.${method}):`, error);
      throw new Error(`Failed to call ${apiName}.${method}: ${error.message}`);
    }
  }

  /**
   * Get API key for client-side requests
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Check if service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      await this.auth.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let gcpService: GoogleCloudService | null = null;

export function getGCPService(): GoogleCloudService {
  if (!gcpService) {
    const config: GCPConfig = {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDqvzfYzcV49VY4Ysc0FQT4-B_yexlC2Mc',
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      region: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
    };

    gcpService = new GoogleCloudService(config);
  }

  return gcpService;
}

export default GoogleCloudService;