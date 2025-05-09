import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check OpenAI configuration
    const openaiKeyExists = !!process.env.OPENAI_API_KEY;
    const xaiKeyExists = !!process.env.XAI_API_KEY;

    // Get providers from database
    const { getProviders } = await import('@/lib/db/queries');
    const providers = await getProviders();

    // Extract provider configuration
    const providerConfig = providers.map((provider) => ({
      slug: provider.slug,
      name: provider.name,
      hasApiKey: !!provider.apiKey,
      hasBaseUrl: !!provider.baseUrl,
      enabled: provider.enabled,
    }));

    return NextResponse.json({
      environmentKeys: {
        openai: openaiKeyExists
          ? 'Configured from environment'
          : 'Not configured',
        xai: xaiKeyExists ? 'Configured from environment' : 'Not configured',
      },
      databaseProviders: providerConfig,
      message: 'This is a test endpoint to check API configuration.',
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
