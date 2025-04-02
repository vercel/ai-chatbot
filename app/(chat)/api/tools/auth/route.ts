import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authId, toolName, args } = await request.json();
    if (!authId || !toolName || !args) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (!arcadeServer) {
      return NextResponse.json(
        { error: 'Arcade server not initialized' },
        { status: 500 },
      );
    }

    const result = await arcadeServer.waitForAuthAndExecute({
      authId,
      toolName,
      args,
      userId: session.user.id,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auth completion endpoint', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
