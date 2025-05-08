import { auth } from '@/app/(auth)/auth';
import {
  getUserSettings,
  createOrUpdateUserSettings,
} from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Get user settings
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  
  try {
    const settings = await getUserSettings(userId);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await req.json();

    const settingsSchema = z.object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().int().optional(),
      topP: z.number().min(0).max(1).optional(),
      frequencyPenalty: z.number().min(-2).max(2).optional(),
      presencePenalty: z.number().min(-2).max(2).optional(),
    });

    const validatedSettings = settingsSchema.parse(body);
    
    const updatedSettings = await createOrUpdateUserSettings(
      userId,
      validatedSettings
    );

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 