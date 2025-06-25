import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Assuming db instance is exported from lib/db
import { user as userSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const result = await db
      .select({
        walletBalance: userSchema.walletBalance,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (result.length === 0) {
      // This case should ideally not happen if the user is authenticated
      // and has an entry in the user table.
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ walletBalance: result[0].walletBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
