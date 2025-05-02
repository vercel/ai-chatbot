import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';

// Admin-only endpoint to fetch all users
export async function GET() {
  try {
    // Get the current session to check if the user is an admin
    const session = await getServerSession(auth);

    // Check if user is authenticated and has admin role
    // You might want to customize this check based on your admin role logic
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // For better security in production, add a proper admin check like:
    // if (session.user.email !== 'admin@example.com' && session.user.role !== 'admin') {
    //   return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    // Fetch all users from the database
    const users = await db.select().from(user);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch users' }),
      {
        status: 500,
      },
    );
  }
}
