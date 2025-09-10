import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { track } from '@/apps/web/lib/analytics/events.pix';

export const runtime = 'edge';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const messages = await req.json();

  track({
    name: 'pix_activation_start',
    payload: { user_id: params.id, channel: 'web' },
  });

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages,
    tools: [
      {
        type: 'function',
        name: 'track',
        description: 'Envio de eventos de analytics',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            payload: { type: 'object' },
          },
          required: ['name', 'payload'],
        },
      },
    ],
  });

  track({
    name: 'pix_activation_success',
    payload: { user_id: params.id, value: 1 },
  });

  return response.toStreamResponse({
    onEvent(event) {
      if (event.type === 'tool' && event.name === 'track') {
        track(event.arguments as any);
      }
    },
  });
}
