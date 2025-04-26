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
    const provider = 'oauth_google';
    // Type is PaginatedResourceResponse, not array directly - adjust variable name and remove explicit type
    const oauthTokensResponse = await client.users.getUserOauthAccessToken(
      userId,
      provider,
    );

    // --- Add Detailed Logging ---
    console.log(
      '[getGoogleOAuthToken] Raw oauthTokensResponse:',
      JSON.stringify(oauthTokensResponse, null, 2),
    );
    // --- End Detailed Logging ---

    // Access .data before using .find()
    const googleToken = oauthTokensResponse?.data?.find(
      (token: OauthAccessToken) => token.provider === provider,
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
