import { NextResponse } from 'next/server';
import { saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const {
      chatId,
      responseMessage,
      parts,
    }: {
      chatId: string;
      responseMessage: string;
      parts?: Array<{ type: string; text: string }>;
    } = await request.json();

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

    // Save the assistant message
    await saveMessages({ messages: [dbMessage] });

    // Revalidate chat cache so front-end can pick up the new message
    revalidateTag(`chat-${chatId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[n8n-callback] Error saving assistant message:', error);
    return NextResponse.error();
  }
}
