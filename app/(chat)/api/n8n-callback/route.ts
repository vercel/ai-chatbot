import { NextResponse } from 'next/server';
import { saveMessages } from '@/lib/db/queries';
import { revalidateTag } from 'next/cache';

interface CallbackResult {
  error?: string;
  success?: boolean;
}

declare global {
  var activeStreams:
    | Map<string, { dataStream: any; heartbeatInterval: NodeJS.Timeout }>
    | undefined;
  var streamResolvers: Map<string, (value: CallbackResult) => void> | undefined;
}

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

    // Check if we have a waiting stream resolver
    const streamResolver = global.streamResolvers?.get(chatId);
    const streamEntry = global.activeStreams?.get(chatId);

    if (!streamResolver) {
      console.warn(
        `[n8n-callback] No waiting stream resolver found for chat ${chatId}`,
      );
    } else {
      console.log(
        `[n8n-callback] Found waiting stream resolver for chat ${chatId}`,
      );
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

    // If we have a waiting stream, resolve the promise to complete it
    if (streamResolver && streamEntry) {
      try {
        // Get the dataStream to send the actual message
        const { dataStream } = streamEntry;

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

        console.log('[n8n-callback] Sent response through active stream');

        // Resolve the promise to complete the waiting execute function
        streamResolver({ success: true });

        // Clean up the stream resolver and active stream
        global.streamResolvers?.delete(chatId);
        global.activeStreams?.delete(chatId);

        console.log('[n8n-callback] Resolved stream promise for chat', chatId);
      } catch (streamError) {
        console.error(
          '[n8n-callback] Error sending through stream:',
          streamError,
        );
        // Resolve with error
        streamResolver({
          error:
            streamError instanceof Error ? streamError.message : 'Stream error',
        });
        global.streamResolvers?.delete(chatId);
        global.activeStreams?.delete(chatId);
      }
    }

    // Revalidate chat cache so other clients can pick up the new message
    revalidateTag(`chat-${chatId}`);

    console.log('[n8n-callback] Successfully processed callback');

    return NextResponse.json({
      ok: true,
      streamDelivered: !!streamResolver,
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
