import { NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/db/queries';

// POST /api/invitations/validate - Validate an invitation token
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation has already been used or revoked
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { valid: false, error: `Invitation has been ${invitation.status}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Failed to validate invitation:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}