import { NextResponse } from 'next/server';
import type { ChatModel } from '@/lib/ai/models';

export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    const models: ChatModel[] = data.data
      .filter((model: any) => model.id.includes('chat') || model.id.includes('instruct'))
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id.split('/').pop(),
        description: model.description || 'OpenRouter model',
      }));

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}