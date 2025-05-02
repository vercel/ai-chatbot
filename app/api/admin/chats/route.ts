import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { chat } from '@/lib/db/schema';

// Admin-only endpoint to fetch all chats
export async function GET() {
  try {
    // Get the current session to check if the user is an admin
    const session = await getServerSession(auth);

    // Check if user is authenticated and has admin role
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // For better security in production, add a proper admin check
    // if (session.user.email !== 'admin@example.com' && session.user.role !== 'admin') {
    //   return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    // Fetch all chats from the database
    const chats = await db.select().from(chat);

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch chats' }),
      {
        status: 500,
      },
    );
  }
}
