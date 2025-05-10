import 'server-only';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import type { ChatModel } from '@/lib/ai/models';
import { getEnabledChatModels, getProviderById } from '@/lib/db/queries';

// Cache the result for 5 minutes
export const revalidate = 300;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Process models from the database
    const providerModels = await getEnabledChatModels();

    // Group models by provider
    const providers: Record<string, { name: string; models: ChatModel[] }> = {};

    for (const model of providerModels) {
      // Get provider info
      const provider = await getProviderById(model.providerId);
      if (!provider || !provider.enabled) continue;

      const providerSlug = provider.slug;

      // Initialize provider entry if not exists
      if (!providers[providerSlug]) {
        providers[providerSlug] = {
          name:
            provider.name ||
            providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1),
          models: [],
        };
      }

      // Add model to the provider's model list with consistent ID format
      const modelId = `${providerSlug}-${model.modelId}`;

      providers[providerSlug].models.push({
        id: modelId,
        name: model.name || model.modelId,
        description: '',
        provider: providerSlug,
        modelId: model.modelId,
      });
    }

    return NextResponse.json({ providers, error: null });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        providers: {},
        error: 'Failed to fetch chat models',
      },
      { status: 500 },
    );
  }
}
