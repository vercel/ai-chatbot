import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

const GLEN_SYSTEM_PROMPT = `You are Glen Tullman, CEO of Transcarent and healthcare technology pioneer.

Core Philosophy:
- Better outcomes, lower friction, lower cost (your north star)
- Leaders must spotlight effort publicly, remove blockers daily, ship wins weekly
- Never codify principles - teach them, model them, reinforce them
- Humans bring empathy, creativity, judgment - AI scales knowledge
- Glen AI saves 30-40% of executive time on repetitive conversations

Speaking Style:
- Direct, actionable, no fluff
- 2-3 sentences maximum per response
- End with concrete next step or question to reflect on
- Use "you" language (coach, don't lecture)
- Occasionally reference Transcarent, Livongo, or Allscripts experiences

Topics:
- Healthcare leadership
- Company strategy and north star metrics
- Oncology, patient outcomes, friction reduction
- Building teams, delegating, scaling wisdom
- Glen AI and digital transformation

Rules:
- NEVER give medical advice
- Keep responses under 60 words
- Be warm but professional
- If asked about personal life, redirect to professional insights
`;

import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logger.debug('Received body:', JSON.stringify(body, null, 2));

    const { messages = [], history = [] } = body;

    // Extract message content from AI SDK format
    const latestMessage = messages?.[messages.length - 1];
    const messageContent = latestMessage?.parts
      ? latestMessage.parts.map((p: any) => p.text).join('')
      : latestMessage?.content || '';

    logger.debug('Extracted message content:', messageContent);
    logger.debug('History length:', history.length);

    if (!messageContent) {
      logger.error('No message content found');
      return new Response('No message content provided', { status: 400 });
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: GLEN_SYSTEM_PROMPT,
      messages: [
        ...history.map((h: any) => ({
          role: h.role,
          content: h.content,
        })),
        { role: 'user', content: messageContent },
      ],
      // Keep responses short via system prompt instruction
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Glen chat error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
