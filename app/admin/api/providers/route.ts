import 'server-only';
import { NextResponse } from 'next/server';
import { getProviders, updateProvider } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// GET /admin/api/providers - Get all providers
export async function GET() {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    // Get providers
    const providers = await getProviders();
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Failed to get providers:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 },
    );
  }
}
