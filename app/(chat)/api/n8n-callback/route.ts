import { NextResponse } from 'next/server';
import { saveMessages } from '@/lib/db/queries';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  console.log('[n8n-callback] POST request received');

  try {
    // Verify callback secret if configured
    const callbackSecret = process.env.N8N_CALLBACK_SECRET_KEY;
    console.log(
      '[n8n-callback] Checking auth with secret:',
      callbackSecret ? 'present' : 'missing',
    );

    if (callbackSecret) {
      const authHeader = request.headers.get('authorization');
      console.log(
        '[n8n-callback] Auth header:',
        authHeader ? 'present' : 'missing',
      );

      if (!authHeader || authHeader !== `Bearer ${callbackSecret}`) {
        console.error('[n8n-callback] Invalid or missing authorization header');
        console.error('[n8n-callback] Expected:', `Bearer ${callbackSecret}`);
        console.error('[n8n-callback] Received:', authHeader);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    console.log('[n8n-callback] Request body:', JSON.stringify(body, null, 2));

    const {
      chatId,
      responseMessage,
      parts,
    }: {
      chatId: string;
      responseMessage: string;
      parts?: Array<{ type: string; text: string }>;
    } = body;

    console.log('[n8n-callback] Received callback for chat:', chatId);
    console.log(
      '[n8n-callback] Response message length:',
      responseMessage?.length || 0,
    );

    // Get the active stream for this chat
    const streamEntry = global.activeStreams?.get(chatId);

    if (!streamEntry) {
      console.warn(`[n8n-callback] No active stream found for chat ${chatId}`);
    } else {
      console.log(`[n8n-callback] Found active stream for chat ${chatId}`);
    }

    // Build message parts
    const messageParts =
      parts && parts.length > 0
        ? parts
        : [{ type: 'text', text: responseMessage }];

    // Save message to database
    console.log('[n8n-callback] Saving assistant message to database...');
    await saveMessages({
      messages: [
        {
          chatId: chatId,
          role: 'assistant',
          parts: messageParts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    console.log('[n8n-callback] Successfully saved assistant message');

    // If we have an active stream, send the response through it
    if (streamEntry) {
      try {
        const { dataStream, heartbeatInterval } = streamEntry;

        // Send the assistant message through the stream
        dataStream.writeMessageAnnotation({
          type: 'assistant-response',
          chatId: chatId,
          message: {
            role: 'assistant',
            content: messageParts,
            createdAt: new Date().toISOString(),
          },
        });

        // Send completion signal
        dataStream.writeData({
          type: 'completion',
          chatId: chatId,
          timestamp: Date.now(),
        });

        console.log('[n8n-callback] Sent response through active stream');

        // Clean up the stream
        clearInterval(heartbeatInterval);
        global.activeStreams?.delete(chatId);
        console.log('[n8n-callback] Cleaned up stream for chat', chatId);
      } catch (streamError) {
        console.error(
          '[n8n-callback] Error sending through stream:',
          streamError,
        );
        // Continue with database fallback
      }
    }

    // Revalidate chat cache so other clients can pick up the new message
    revalidateTag(`chat-${chatId}`);

    console.log('[n8n-callback] Successfully processed callback');

    return NextResponse.json({
      ok: true,
      streamDelivered: !!streamEntry,
    });
  } catch (error: any) {
    console.error('[n8n-callback] Error processing callback:', error);
    console.error('[n8n-callback] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}
