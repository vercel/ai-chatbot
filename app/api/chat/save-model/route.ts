import { NextRequest, NextResponse } from 'next/server';
import { saveChatModelAsCookie } from '../../../(chat)/actions';

export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json();
    if (!model) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }
    await saveChatModelAsCookie(model);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving model:', error);
    return NextResponse.json({ error: 'Failed to save model' }, { status: 500 });
  }
}