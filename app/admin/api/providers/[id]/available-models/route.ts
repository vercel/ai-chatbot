import 'server-only';
import { NextResponse } from 'next/server';
import {
  getProviderById,
  fetchAvailableModelsFromProvider,
} from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// GET /admin/api/providers/[id]/available-models - Get all available models from provider API
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    const { id: providerId } = await params;
    const provider = await getProviderById(providerId);

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 },
      );
    }

    // Return the models regardless of the provider - our backend handles fallbacks
    const result = await fetchAvailableModelsFromProvider(providerId);

    // Always return models if we have them, even with an error
    return NextResponse.json(
      {
        error: result.error,
        models: result.models || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to get available provider models:', error);
    return NextResponse.json(
      { error: 'Failed to get available provider models', models: [] },
      { status: 200 }, // Return 200 to make error handling more predictable
    );
  }
}
