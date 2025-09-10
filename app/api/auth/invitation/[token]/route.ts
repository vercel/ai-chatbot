import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationInvitation, organization, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get invitation with organization and inviter details
    const result = await db
      .select({
        invitation: organizationInvitation,
        organization: organization,
        inviter: {
          email: user.email,
        },
      })
      .from(organizationInvitation)
      .innerJoin(organization, eq(organizationInvitation.organizationId, organization.id))
      .innerJoin(user, eq(organizationInvitation.inviterId, user.id))
      .where(eq(organizationInvitation.token, token))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const { invitation, organization: org, inviter } = result[0];

    // Check if invitation has already been accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    const isExpired = invitation.status === 'expired' || new Date() > invitation.expiresAt;

    // Mark as expired in database if it has passed expiration
    if (isExpired && invitation.status !== 'expired') {
      await db
        .update(organizationInvitation)
        .set({ status: 'expired' })
        .where(eq(organizationInvitation.token, token));
    }

    return NextResponse.json({
      email: invitation.email,
      organizationName: org.name,
      role: invitation.role,
      inviterEmail: inviter.email,
      isExpired,
    });
  } catch (error) {
    console.error('Invitation lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to load invitation' },
      { status: 500 }
    );
  }
}