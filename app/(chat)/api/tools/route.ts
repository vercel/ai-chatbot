import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { arcadeServer } from '@/lib/arcade/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        },
      );
    }

    const { toolName, args } = await request.json();
    if (!toolName || !args) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: 400,
      });
    }

    if (!arcadeServer) {
      return NextResponse.json({
        success: false,
        error: 'Arcade not initialized in the server',
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: 500,
      });
    }

    const result = await arcadeServer.executeTool({
      toolName,
      args,
      userId: session.user.id,
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error,
        instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
        status: result.error === 'Tool not found' ? 404 : 500,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in tool execution endpoint', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error in tool execution',
      instructions: 'STOP NEXT TOOL CALLS AND REPORT THIS ERROR TO THE USER',
      status: 500,
    });
  }
}
