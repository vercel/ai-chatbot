import { NextResponse, type NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

// Ensure CLERK_SECRET_KEY is set in your environment variables (Vercel)
// Ensure N8N_PROXY_SECRET_KEY is set in your environment variables (Vercel)

export async function POST(req: NextRequest) {
  console.log('[API /clerk-token-proxy] Request received.');

  // --- Security Check ---
  const expectedApiKey = process.env.N8N_PROXY_SECRET_KEY;
  const authorizationHeader = req.headers.get('Authorization');

  if (!expectedApiKey) {
    console.error('[API /clerk-token-proxy] N8N_PROXY_SECRET_KEY not set.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  if (!authorizationHeader || !authorizationHeader.startsWith('ApiKey ')) {
    console.warn(
      '[API /clerk-token-proxy] Missing or invalid Authorization header format.',
    );
    return NextResponse.json(
      { error: 'Unauthorized: Invalid header format' },
      { status: 401 },
    );
  }

  const providedApiKey = authorizationHeader.substring(7); // Remove "ApiKey " prefix

  if (providedApiKey !== expectedApiKey) {
    console.warn('[API /clerk-token-proxy] Invalid API Key provided.');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API Key' },
      { status: 401 },
    );
  }
  // --- End Security Check ---

  let clerkUserId: string | undefined;
  try {
    const body = await req.json();
    clerkUserId = body.clerkUserId;

    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid clerkUserId in request body' },
        { status: 400 },
      );
    }
    console.log(
      `[API /clerk-token-proxy] Processing request for Clerk ID: ${clerkUserId}`,
    );
  } catch (error) {
    console.error(
      '[API /clerk-token-proxy] Error parsing request body:',
      error,
    );
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  try {
    // Correctly await the asynchronous clerkClient function
    const client = await clerkClient();

    // Fetch the Google OAuth token using the Backend API
    const googleProvider = 'google';
    // Let TypeScript infer the type for tokenResponse
    const tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      googleProvider,
    );

    // Type guard remains useful
    if (
      !Array.isArray(tokenResponse) ||
      tokenResponse.length === 0 ||
      !tokenResponse[0].token
    ) {
      console.log(
        `[API /clerk-token-proxy] No Google OAuth token found for user ${clerkUserId}. Response:`,
        tokenResponse,
      );
      return NextResponse.json(
        { error: 'OAuth token not found for this user and provider' },
        { status: 404 },
      );
    }

    const accessToken = tokenResponse[0].token;
    const expiresAt = tokenResponse[0].expires_at; // Optional: you could return this too

    console.log(
      `[API /clerk-token-proxy] Successfully retrieved Google token for user ${clerkUserId}.`,
    );

    // Return the access token
    return NextResponse.json({
      accessToken: accessToken,
      expiresAt: expiresAt,
    });
  } catch (error: any) {
    // Log Clerk errors or other issues
    console.error(
      `[API /clerk-token-proxy] Error fetching token for ${clerkUserId}:`,
      error,
    );

    // Provide a generic error message
    let status = 500;
    let message = 'Internal server error fetching token';

    // Check for specific Clerk client errors
    // Use optional chaining for safer access to nested error properties
    if (error?.status === 404) {
      status = 404;
      message = 'User not found by Clerk';
    } else if (error?.clerkError) {
      message = error.errors?.[0]?.longMessage || error.message || message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: status });
  }
}
