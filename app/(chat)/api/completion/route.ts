import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const { text } = await generateText({
    model: openai('gpt-4'),
    system: 'You are a helpful assistant which answers questions about logs stored in Elasticsearch.',
    prompt,
  });

  return Response.json({ text });
}