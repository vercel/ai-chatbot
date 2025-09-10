import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationInvitation, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateHashedPassword } from '@/lib/db/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitations = await db
      .select()
      .from(organizationInvitation)
      .where(eq(organizationInvitation.token, token))
      .limit(1);

    if (invitations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const invitation = invitations[0];

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await db
        .update(organizationInvitation)
        .set({ status: 'expired' })
        .where(eq(organizationInvitation.token, token));

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, invitation.email));

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create the user account
    const hashedPassword = generateHashedPassword(password);
    
    await db.insert(user).values({
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      organizationId: invitation.organizationId,
    });

    // Mark invitation as accepted
    await db
      .update(organizationInvitation)
      .set({ 
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(organizationInvitation.token, token));

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}