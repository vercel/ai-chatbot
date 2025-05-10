/**
 * DEPRECATED: This route is deprecated and will be removed in the future.
 * Please use /api/chat/models instead. This route is kept for backwards compatibility
 * until all client components are updated to use the new route.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getAvailableChatModels } from '@/lib/ai/models';

// Cache the result for 5 minutes - reduced from 1 hour for more frequent updates
export const revalidate = 300;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const models = await getAvailableChatModels();

    // Group models by provider
    const providers: Record<string, { name: string; models: any[] }> = {};

    // Process models
    for (const model of models) {
      const providerSlug = model.provider;

      // Initialize provider entry if not exists
      if (!providers[providerSlug]) {
        providers[providerSlug] = {
          name: providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1), // Capitalize provider name
          models: [],
        };
      }

      // Add model to the provider's model list
      providers[providerSlug].models.push(model);
    }

    // Return models grouped by provider
    return NextResponse.json({
      providers,
      error: null,
    });
  } catch (error: any) {
    console.error('Error in models API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
