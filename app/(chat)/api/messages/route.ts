import { NextResponse } from 'next/server';
import { getMessagesByChatId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  try {
    const messages = await getMessagesByChatId({ id: chatId });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('[/api/messages] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}
