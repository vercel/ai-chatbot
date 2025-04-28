'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { OauthAccessToken } from '@clerk/nextjs/server';

export async function getGoogleOAuthToken(): Promise<{
  error: string | null;
  token: string | null;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: 'User not authenticated', token: null };
    }

    // ADD: Await clerkClient() to satisfy linter error
    const client = await clerkClient();

    // Fetch the OAuth access token using the awaited client
    // Follow deprecation warning: Use unprefixed provider name for the *function argument*
    const providerArg = 'google';
    const providerCheck = 'oauth_google'; // Still check response data for this

    const oauthTokensResponse = await client.users.getUserOauthAccessToken(
      userId,
      providerArg, // Use 'google' as the argument here
    );

    // Access .data before using .find()
    // Keep checking the response data for the 'oauth_google' provider name
    const googleToken = oauthTokensResponse?.data?.find(
      (token: OauthAccessToken) => token.provider === providerCheck,
    );

    if (!googleToken || !googleToken.token) {
      return {
        error: `Google OAuth token not found for user ${userId}`,
        token: null,
      };
    }

    // Return only the token.
    // Security Note: Be cautious about returning raw tokens to the client.
    // It's often better to use the token server-side immediately.
    return { error: null, token: googleToken.token };
  } catch (error) {
    console.error('[GET_GOOGLE_TOKEN_ACTION_ERROR]', error);
    // Avoid leaking detailed errors to the client
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      error: `Failed to retrieve Google OAuth token: ${errorMessage}`,
      token: null,
    };
  }
}
