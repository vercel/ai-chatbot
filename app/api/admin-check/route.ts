import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();

    // Return session and admin status
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            type: session.user.type,
          }
        : null,
      isAdmin: session?.user?.role === 'admin',
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 },
    );
  }
}
