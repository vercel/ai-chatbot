import { auth } from '@/app/(auth)/auth';
import {
  createUserPersona,
  updateUserPersona,
  getUserPersonas,
} from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Get user's persona
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const personas = await getUserPersonas(userId);
    return NextResponse.json({ personas });
  } catch (error) {
    console.error('Error fetching user persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 },
    );
  }
}

// Create or update user's persona
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await req.json();

    const personaSchema = z.object({
      name: z.string().min(1).max(64),
      systemMessage: z.string().optional(),
      persona: z.string().optional(),
    });

    const { name, systemMessage, persona } = personaSchema.parse(body);

    const personaRecord = await createUserPersona({
      userId,
      name,
      systemMessage,
      persona,
    });

    return NextResponse.json({ persona: personaRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Error creating/updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create/update persona' },
      { status: 500 },
    );
  }
}

// Update user's existing persona
export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await req.json();

    const updateSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(64).optional(),
      systemMessage: z.string().optional(),
      persona: z.string().optional(),
    });

    const { id, name, systemMessage, persona } = updateSchema.parse(body);

    const updatedPersona = await updateUserPersona(id, userId, {
      name,
      systemMessage,
      persona,
    });

    return NextResponse.json({ persona: updatedPersona });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 },
    );
  }
}
