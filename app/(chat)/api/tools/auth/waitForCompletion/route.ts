import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authId } = await request.json();
    if (!authId) {
      return NextResponse.json({ error: 'Missing auth ID' }, { status: 400 });
    }

    if (!arcadeServer) {
      return NextResponse.json(
        { error: 'Arcade server not initialized' },
        { status: 500 },
      );
    }

    const authResponse =
      await arcadeServer.client.auth.waitForCompletion(authId);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error in auth check endpoint', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
