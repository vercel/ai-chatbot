import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getProviderBySlug } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { model = 'openai-gpt4o' } = await request.json();

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

    // Return a debug response with API information
    return NextResponse.json({
      success: true,
      model,
      provider,
      apiKeyExists: !!apiKey,
      baseUrlExists: !!baseUrl,
      message:
        'This is a debug response. The actual API call has been disabled to fix build issues.',
    });
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
