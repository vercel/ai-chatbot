'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export async function getGoogleOAuthToken(): Promise<{
  error: string | null;
  token: string | null;
}> {
  try {
    const { userId } = auth();

    if (!userId) {
      return { error: 'User not authenticated', token: null };
    }

    // Fetch the OAuth access token for the user
    const provider = 'oauth_google';
    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      userId,
      provider,
    );

    // The response is an array; find the Google token.
    const googleToken = clerkResponse?.find(
      (token) => token.provider === provider,
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
