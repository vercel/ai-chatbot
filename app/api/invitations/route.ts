import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  createInvitation,
  getInvitationsByInviter,
  isUserAdmin,
  updateInvitationStatus,
} from '@/lib/db/queries';

// GET /api/invitations - Get invitations created by current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invitations = await getInvitationsByInviter(session.user.id);
    
    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Failed to get invitations:', error);
    return NextResponse.json(
      { error: 'Failed to get invitations' },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (only admins can invite for now)
    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can send invitations' },
        { status: 403 }
      );
    }

    const { email, expiresInDays } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const invitation = await createInvitation({
      email,
      invitedBy: session.user.id,
      expiresInDays: expiresInDays || 7,
    });

    // TODO: Send invitation email here
    // For now, we'll return the invitation token in the response
    // In production, this should be sent via email only

    return NextResponse.json({
      invitation,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4004'}/register?token=${invitation.token}`,
    });
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations - Revoke an invitation
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can revoke invitations' },
        { status: 403 }
      );
    }

    await updateInvitationStatus(token, 'revoked');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}