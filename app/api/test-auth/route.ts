import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('[API /api/test-auth] Attempting to call auth()...');
    const { userId } = await auth();
    console.log(
      `[API /api/test-auth] auth() call completed. Clerk User ID: ${userId}`,
    );

    if (!userId) {
      console.log('[API /api/test-auth] User not authenticated.');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 },
      );
    }

    console.log(
      `[API /api/test-auth] Returning authenticated userId: ${userId}`,
    );
    return NextResponse.json({ userId: userId });
  } catch (error) {
    console.error('[API /api/test-auth] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    );
  }
}
