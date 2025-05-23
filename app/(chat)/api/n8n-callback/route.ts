import { NextResponse } from 'next/server';
import { saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
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
      responseMessage,
      parts,
    }: {
      chatId: string;
      responseMessage: string;
      parts?: Array<{ type: string; text: string }>;
    } = await request.json();

    console.log('[n8n-callback] Received callback for chat:', chatId);
    console.log(
      '[n8n-callback] Response message length:',
      responseMessage?.length || 0,
    );

    // Build message record
    const messageId = generateUUID();
    const messageParts =
      parts && parts.length > 0
        ? parts
        : [{ type: 'text', text: responseMessage }];

    const dbMessage = {
      id: messageId,
      chatId,
      role: 'assistant' as const,
      parts: messageParts,
      attachments: [],
      createdAt: new Date(),
    };

    console.log('[n8n-callback] Saving assistant message with ID:', messageId);

    // Save the assistant message
    await saveMessages({ messages: [dbMessage] });

    // Revalidate chat cache so front-end can pick up the new message
    revalidateTag(`chat-${chatId}`);

    console.log(
      '[n8n-callback] Successfully saved message and revalidated cache',
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[n8n-callback] Error saving assistant message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
