import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Ensure this route is processed dynamically
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[API /api/minimal-auth-test] Route hit.');
  try {
    // Attempt to get auth context
    const { userId } = auth();

    console.log(
      `[API /api/minimal-auth-test] auth() returned userId: ${userId}`,
    );

    if (!userId) {
      console.log('[API /api/minimal-auth-test] User ID is null/undefined.');
      return NextResponse.json(
        { error: 'Authentication failed: No userId found server-side.' },
        { status: 401 },
      );
    }

    console.log(
      `[API /api/minimal-auth-test] Authentication successful. userId: ${userId}`,
    );
    // Return success if userId is found
    return NextResponse.json({ success: true, userId: userId });
  } catch (error) {
    console.error(
      '[API /api/minimal-auth-test] Error during auth check:',
      error,
    );
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal Server Error: ${message}` },
      { status: 500 },
    );
  }
}
