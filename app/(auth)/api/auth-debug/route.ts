import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    // Get current session
    const session = await auth();

    // Return session information
    return NextResponse.json(
      {
        authenticated: !!session?.user,
        session: session
          ? {
              user: {
                id: session.user?.id,
                email: session.user?.email,
                role: session.user?.role,
                type: session.user?.type,
              },
              expires: session.expires,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred checking authentication',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
