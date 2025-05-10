import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getProviders } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    // Get provider information from the database
    let providers: Record<
      string,
      {
        fromEnv: boolean;
        apiKey: string | null;
        baseUrl: string | null;
      }
    > | null = null;

    try {
      if (session?.user) {
        const dbProviders = await getProviders();

        providers = {};
        // Convert DB providers to client-friendly format
        for (const provider of dbProviders) {
          providers[provider.slug] = {
            fromEnv: false, // Database providers are not from env
            apiKey: provider.apiKey ? '[CONFIGURED]' : null,
            baseUrl: provider.baseUrl || null,
          };
        }
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }

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
      providers,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 },
    );
  }
}
