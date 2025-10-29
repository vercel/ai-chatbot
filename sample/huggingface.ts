import OpenAI from 'openai';
import { ChatMessage } from '../mistral';

let huggingfaceClient: OpenAI | null = null;

function getHuggingFaceClient(): OpenAI {
    const token = process.env.HF_TOKEN;
    if (!token) {
        throw new Error('API key not found (HF_TOKEN).');
    }
    if (!huggingfaceClient) {
        huggingfaceClient = new OpenAI({
            baseURL: 'https://router.huggingface.co/v1',
            apiKey: token,
        });
    }
    return huggingfaceClient;
}

export async function* generateHuggingFaceStreamingResponse(
    messages: ChatMessage[],
    model: string,
    options: Record<string, unknown> = {}
) {
    try {
        const client = getHuggingFaceClient();
        const stream = await client.chat.completions.create({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
            temperature: 0.7,
            ...options,
        });

        for await (const part of stream) {
            const content = part.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    } catch (error) {
        console.error('HuggingFace streaming error:', error);
        throw new Error('Failed to generate streaming AI response');
    }
}

export async function generateHuggingFaceChatResponse(
    messages: ChatMessage[],
    model: string,
    options: Record<string, unknown> = {}
) {
    try {
        const client = getHuggingFaceClient();
        const response = await client.chat.completions.create({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            ...options,
        });

        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('HuggingFace chat error:', error);
        throw new Error('Failed to generate AI response');
    }
}
