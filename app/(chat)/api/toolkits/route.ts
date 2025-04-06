import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!arcadeServer) {
      return NextResponse.json(
        { error: 'Arcade not initialized in the server' },
        { status: 500 },
      );
    }

    const toolkits = await arcadeServer.getToolkits();

    return NextResponse.json(toolkits);
  } catch (error) {
    console.error('Error in toolkits endpoint', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error fetching toolkits',
      },
      { status: 500 },
    );
  }
}
