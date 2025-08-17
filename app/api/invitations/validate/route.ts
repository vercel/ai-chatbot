import { NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/db/queries';

// POST /api/invitations/validate - Validate an invitation token
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    console.log('🔍 Validating invitation token:', token);

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const invitation = await getInvitationByToken(token);
    console.log('📋 Found invitation:', invitation ? 'Yes' : 'No');

    if (!invitation) {
      console.log('❌ Invitation not found in database');
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    console.log('📊 Invitation details:', {
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      email: invitation.email
    });

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      console.log('❌ Invitation has expired');
      return NextResponse.json(
        { valid: false, error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation has already been used or revoked
    if (invitation.status !== 'pending') {
      console.log('❌ Invitation status is not pending:', invitation.status);
      return NextResponse.json(
        { valid: false, error: `Invitation has been ${invitation.status}` },
        { status: 410 }
      );
    }

    console.log('✅ Invitation is valid');
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