import { NextResponse } from 'next/server';
import { AIModel } from '@/types/models';

// Define Hugging Face models
export const models: AIModel[] = [
    {
        id: 'openai/gpt-oss-120b:novita',
        name: 'GPT-OSS 120B',
        description: 'High-performance open source large language model',
        maxTokens: 32768,
        provider: 'huggingface',
        contextLength: 32768,
        pricing: {
            input: 0,
            output: 0,
        },
    },
];

// API handler for model listing
export async function GET() {
    try {
        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching Hugging Face models:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}

// API handler for chat completions
export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!process.env.HF_TOKEN) {
            return NextResponse.json(
                { error: 'Hugging Face API token not configured' },
                { status: 500 }
            );
        }

        const { createCompletion } = await import('./index');
        const stream = await createCompletion({
            model: "openai/gpt-oss-120b:novita",
            messages,
            stream: true,
        });

        return new Response(stream as unknown as ReadableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Hugging Face API error:', error);
        return NextResponse.json(
            { error: 'Error processing your request' },
            { status: 500 }
        );
    }
}
