import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/queries';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

export async function GET() {
  try {
    // Get Clerk auth status
    const { userId: clerkUserId, sessionId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          message: 'No Clerk user ID found. Please sign in.',
          auth: { clerkUserId, sessionId },
        },
        { status: 401 },
      );
    }

    // Check if user profile exists
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.clerkId, clerkUserId),
    });

    if (!profile) {
      // Create a profile if it doesn't exist
      const newProfileId = crypto.randomUUID();

      await db.insert(userProfiles).values({
        id: newProfileId,
        clerkId: clerkUserId,
      });

      return NextResponse.json({
        success: true,
        message: 'Fixed: Created missing user profile',
        auth: { clerkUserId, sessionId },
        newProfile: { id: newProfileId, clerkId: clerkUserId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User authenticated and profile exists',
      auth: { clerkUserId, sessionId },
      profile: { id: profile.id, clerkId: profile.clerkId },
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
