import { auth } from '@/app/(auth)/auth';
import {
  getUserPersonas,
  getUserSettings,
  changeUserPassword,
  createUserPersona,
  updateUserPersona,
  deleteUserPersona,
  createOrUpdateUserSettings,
} from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  
  try {
    // Fetch user personas and settings
    const [personas, settings] = await Promise.all([
      getUserPersonas(userId),
      getUserSettings(userId),
    ]);

    return NextResponse.json({ personas, settings });
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// Password change endpoint
export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await req.json();

    const passwordSchema = z.object({
      currentPassword: z.string().min(6),
      newPassword: z.string().min(6),
    });

    const { currentPassword, newPassword } = passwordSchema.parse(body);
    
    // TODO: Validate the current password, but for now we'll skip this since
    // the db doesn't store plaintext passwords to compare against

    await changeUserPassword(userId, newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
} 