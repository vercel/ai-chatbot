import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Verify callback secret if configured
    const callbackSecret = process.env.N8N_CALLBACK_SECRET;
    if (callbackSecret) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${callbackSecret}`) {
        console.error('[n8n-callback] Invalid or missing authorization header');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const {
      chatId,
      messageId,
      responseMessage,
      parts,
    }: {
      chatId: string;
      messageId: string;
      responseMessage: string;
      parts?: Array<{ type: string; text: string }>;
    } = await request.json();

    console.log('[n8n-callback] Received callback for chat:', chatId);
    console.log('[n8n-callback] Updating message ID:', messageId);
    console.log(
      '[n8n-callback] Response message length:',
      responseMessage?.length || 0,
    );

    // Build updated message parts
    const messageParts =
      parts && parts.length > 0
        ? parts
        : [{ type: 'text', text: responseMessage }];

    // Update the existing placeholder message instead of creating new one
    const updateResult = await db
      .update(schema.Message_v2)
      .set({
        parts: messageParts,
        metadata: { status: 'completed' }, // Mark as completed
        // Note: createdAt stays the same, no need to update it
      })
      .where(eq(schema.Message_v2.id, messageId))
      .returning({ id: schema.Message_v2.id });

    if (updateResult.length === 0) {
      console.error('[n8n-callback] No message found with ID:', messageId);
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    console.log('[n8n-callback] Successfully updated message:', messageId);

    // Revalidate chat cache so front-end can pick up the updated message
    revalidateTag(`chat-${chatId}`);

    console.log(
      '[n8n-callback] Successfully updated message and revalidated cache',
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[n8n-callback] Error updating assistant message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
