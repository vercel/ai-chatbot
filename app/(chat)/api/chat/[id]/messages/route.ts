import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/queries';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log('[messages API] GET request received for chat:', params.id);

  try {
    // Auth check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error('[messages API] Unauthorized - No Clerk User ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const profile = await db.query.userProfiles.findFirst({
      columns: { id: true },
      where: eq(schema.userProfiles.clerkId, clerkUserId),
    });
    const userId = profile?.id;
    if (!userId) {
      console.error(
        `[messages API] User profile not found for Clerk ID: ${clerkUserId}`,
      );
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 500 },
      );
    }

    // Verify chat ownership
    const chat = await db.query.Chat.findFirst({
      columns: { userId: true },
      where: eq(schema.Chat.id, params.id),
    });

    if (!chat) {
      console.error(`[messages API] Chat not found: ${params.id}`);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      console.error(
        `[messages API] Unauthorized access to chat ${params.id} by user ${userId}`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get 'since' parameter for polling
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    let sinceDate: Date | undefined;

    if (sinceParam) {
      sinceDate = new Date(sinceParam);
      if (Number.isNaN(sinceDate.getTime())) {
        console.error(`[messages API] Invalid since parameter: ${sinceParam}`);
        return NextResponse.json(
          { error: 'Invalid since parameter' },
          { status: 400 },
        );
      }
    }

    console.log(
      `[messages API] Fetching messages for chat ${params.id}${sinceDate ? ` since ${sinceDate.toISOString()}` : ''}`,
    );

    // Build query conditions
    const conditions = [eq(schema.Message_v2.chatId, params.id)];
    if (sinceDate) {
      conditions.push(gt(schema.Message_v2.createdAt, sinceDate));
    }

    // Fetch messages
    const messages = await db.query.Message_v2.findMany({
      where: and(...conditions),
      orderBy: schema.Message_v2.createdAt,
    });

    console.log(`[messages API] Found ${messages.length} messages`);

    // Transform messages to match frontend format
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      chatId: msg.chatId,
      role: msg.role,
      content:
        msg.parts?.length === 1 && msg.parts[0]?.type === 'text'
          ? msg.parts[0].text
          : msg.parts,
      parts: msg.parts,
      createdAt: msg.createdAt,
      experimental_attachments: msg.attachments || [],
    }));

    return NextResponse.json({
      messages: formattedMessages,
      count: formattedMessages.length,
      since: sinceDate?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('[messages API] Error fetching messages:', error);
    console.error('[messages API] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}
