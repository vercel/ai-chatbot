import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { organizationInvitation, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateUUID } from '@/lib/utils';
import { mg } from '@/lib/email/mailgun';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can invite users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'employee' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in the organization
    const existingUser = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.email, email),
          eq(user.organizationId, session.user.organizationId)
        )
      );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .select()
      .from(organizationInvitation)
      .where(
        and(
          eq(organizationInvitation.email, email),
          eq(organizationInvitation.organizationId, session.user.organizationId),
          eq(organizationInvitation.status, 'pending')
        )
      );

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = generateUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation
    const [invitation] = await db
      .insert(organizationInvitation)
      .values({
        email,
        organizationId: session.user.organizationId,
        inviterId: session.user.id,
        role: role as 'employee' | 'compliance_officer' | 'admin',
        token,
        expiresAt,
      })
      .returning();

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/accept-invitation?token=${token}`;
    
    try {
      await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
        from: `Checky <noreply@${process.env.MAILGUN_DOMAIN}>`,
        to: [email],
        subject: `You're invited to join ${session.user.organizationName} on Checky`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>You're invited to join ${session.user.organizationName}</h2>
            <p>You've been invited by ${session.user.email} to join ${session.user.organizationName} on Checky, our conflict of interest compliance platform.</p>
            <p>Your role will be: <strong>${role}</strong></p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>This invitation expires in 7 days. If you have any questions, please contact your administrator.</p>
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">If you can't click the button above, copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 14px; word-break: break-all;">${inviteUrl}</p>
          </div>
        `,
        text: `You're invited to join ${session.user.organizationName}

You've been invited by ${session.user.email} to join ${session.user.organizationName} on Checky, our conflict of interest compliance platform.

Your role will be: ${role}

Accept your invitation by visiting: ${inviteUrl}

This invitation expires in 7 days. If you have any questions, please contact your administrator.`,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the API call if email fails - the invitation is still created
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}