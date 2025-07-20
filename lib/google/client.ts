import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { googleCredentials } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get Google OAuth configuration from environment variables
 */
function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Create and configure a Google OAuth2 client for a specific user
 */
export async function getGoogleOAuthClient(
  userId: string,
): Promise<OAuth2Client | null> {
  try {
    const config = getGoogleOAuthConfig();

    // Get stored credentials for the user
    console.log('🔍 Looking for Google credentials for user:', userId);
    const credentials = await db
      .select()
      .from(googleCredentials)
      .where(eq(googleCredentials.userId, userId))
      .limit(1);

    if (!credentials.length) {
      console.log('❌ No Google credentials found for user:', userId);
      return null;
    }

    const userCreds = credentials[0];
    console.log('✅ Found Google credentials for user:', userId);
    console.log('Credentials info:', {
      hasAccessToken: !!userCreds.accessToken,
      hasRefreshToken: !!userCreds.refreshToken,
      refreshTokenLength: userCreds.refreshToken?.length,
      expiresAt: userCreds.expiresAt,
      createdAt: userCreds.createdAt,
      updatedAt: userCreds.updatedAt,
    });

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );

    // Set the OAuth credentials from WorkOS
    oauth2Client.setCredentials({
      refresh_token: userCreds.refreshToken,
      access_token: userCreds.accessToken || undefined,
    });

    // Automatically refresh access token when needed
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await db
          .update(googleCredentials)
          .set({
            accessToken: tokens.access_token,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            updatedAt: new Date(),
          })
          .where(eq(googleCredentials.userId, userId));
      }
    });

    return oauth2Client;
  } catch (error) {
    console.error('Error creating Google OAuth client:', error);
    return null;
  }
}

/**
 * Store Google OAuth credentials for a user
 */
export async function storeGoogleCredentials(
  userId: string,
  refreshToken: string,
  accessToken?: string,
  expiresAt?: Date,
): Promise<void> {
  try {
    await db
      .insert(googleCredentials)
      .values({
        userId,
        refreshToken,
        accessToken: accessToken || null,
        expiresAt: expiresAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: googleCredentials.userId,
        set: {
          refreshToken,
          accessToken: accessToken || null,
          expiresAt: expiresAt || null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Error storing Google credentials:', error);
    throw error;
  }
}

/**
 * Get Google Drive API client for a user
 */
export async function getGoogleDriveClient(userId: string) {
  const auth = await getGoogleOAuthClient(userId);
  if (!auth) {
    throw new Error('No Google credentials found for user');
  }

  return google.drive({ version: 'v3', auth });
}

/**
 * Get Google Calendar API client for a user
 */
export async function getGoogleCalendarClient(userId: string) {
  const auth = await getGoogleOAuthClient(userId);
  if (!auth) {
    throw new Error('No Google credentials found for user');
  }

  return google.calendar({ version: 'v3', auth });
}

/**
 * Get Google Gmail API client for a user
 */
export async function getGoogleGmailClient(userId: string) {
  const auth = await getGoogleOAuthClient(userId);
  if (!auth) {
    throw new Error('No Google credentials found for user');
  }

  return google.gmail({ version: 'v1', auth });
}

/**
 * Check if user has Google credentials stored
 */
export async function hasGoogleCredentials(userId: string): Promise<boolean> {
  try {
    const credentials = await db
      .select()
      .from(googleCredentials)
      .where(eq(googleCredentials.userId, userId))
      .limit(1);

    return credentials.length > 0;
  } catch (error) {
    console.error('Error checking Google credentials:', error);
    return false;
  }
}
