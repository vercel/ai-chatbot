import { NextResponse } from 'next/server';
import { db, saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { revalidateTag } from 'next/cache';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
      assistantMessageId,
      responseMessage,
      parts,
    }: {
      chatId: string;
      assistantMessageId: string;
      responseMessage: string;
      parts?: Array<{ type: string; text: string; [key: string]: any }>;
    } = await request.json();

    console.log(
      `[n8n-callback] Received callback for chat: ${chatId}, placeholder ID: ${assistantMessageId}`,
    );
    console.log(
      '[n8n-callback] Response message length:',
      responseMessage?.length || 0,
    );

    if (!chatId || !assistantMessageId || !responseMessage) {
      console.error('[n8n-callback] Missing required fields in callback.');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Construct the final parts for the message
    const finalMessageParts =
      parts && parts.length > 0
        ? parts.map((p) => ({ ...p, status: 'complete' }))
        : [{ type: 'text', text: responseMessage, status: 'complete' }];

    // Update the placeholder message in the DB
    const updatedMessage = await db
      .update(schema.Message_v2)
      .set({
        parts: finalMessageParts,
      })
      .where(eq(schema.Message_v2.id, assistantMessageId))
      .returning();

    if (!updatedMessage || updatedMessage.length === 0) {
      console.error(
        `[n8n-callback] Failed to find or update placeholder message ID: ${assistantMessageId} for chat ${chatId}`,
      );
      return NextResponse.json(
        { error: 'Placeholder message not found or update failed' },
        { status: 404 },
      );
    }

    console.log(
      '[n8n-callback] Successfully updated message ID:',
      assistantMessageId,
    );

    // Revalidate chat messages cache tag
    revalidateTag(`chat-messages-${chatId}`);
    revalidateTag(`chat-${chatId}`);

    console.log(
      '[n8n-callback] Successfully revalidated cache for chat:',
      chatId,
    );

    return NextResponse.json({
      ok: true,
      updatedMessageId: assistantMessageId,
    });
  } catch (error: any) {
    console.error('[n8n-callback] Error processing callback:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status });
  }
}
