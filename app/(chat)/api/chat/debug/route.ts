import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { auth } from '@/app/(auth)/auth';
import { getProviderBySlug } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { model = 'openai-gpt4o' } = await request.json();

    // Simple message
    const messages = [
      { role: 'user', content: 'Hello, can you give me a brief response?' },
    ];

    // Check provider
    const provider = model.split('-')[0] || 'openai';

    // Check if API key exists in environment
    const envApiKey =
      provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : provider === 'xai'
          ? process.env.XAI_API_KEY
          : null;

    // If API key not in environment, check database
    let apiKey = envApiKey;
    let baseUrl =
      provider === 'openai'
        ? process.env.OPENAI_BASE_URL
        : provider === 'xai'
          ? process.env.XAI_BASE_URL
          : undefined;

    if (!apiKey) {
      const providerData = await getProviderBySlug(provider);

      if (providerData?.apiKey) {
        apiKey = providerData.apiKey;
        baseUrl = providerData.baseUrl || undefined;
        console.log(`Using ${provider} API key from database`);
      } else {
        return NextResponse.json(
          {
            error: `No API key found for ${provider}`,
            model,
            environment: !!envApiKey,
          },
          { status: 400 },
        );
      }
    }

    // Try a simple completion
    try {
      // Extract model name from model string
      let modelName;
      if (provider === 'openai') {
        modelName = model.includes('o3mini') ? 'o3-mini' : 'gpt-4o';
      } else if (provider === 'xai') {
        modelName = model.includes('grok2-vision')
          ? 'grok-2-vision-1212'
          : model.includes('grok3-mini')
            ? 'grok-3-mini-beta'
            : 'grok-2-1212';
      } else {
        modelName = 'gpt-4o'; // Default
      }

      // Set up model config
      const modelConfig = { apiKey, baseUrl };

      // Create model instance
      const modelInstance =
        provider === 'openai'
          ? openai(modelName as any, modelConfig as any)
          : xai(modelName as any, modelConfig as any);

      // Get response
      const response = await streamText({
        model: modelInstance,
        system:
          'You are a helpful assistant providing short, friendly responses.',
        messages,
        maxTokens: 100,
      }).toTextResponse();

      // Return response
      return response;
    } catch (modelError: any) {
      console.error('Error calling model API:', modelError);
      return NextResponse.json(
        {
          error: `Error calling ${provider} API: ${modelError.message}`,
          model,
          modelError: modelError.message,
          stack: modelError.stack,
          provider,
          apiKeyExists: !!apiKey,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
