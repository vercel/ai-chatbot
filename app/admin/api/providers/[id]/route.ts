import 'server-only';
import { NextResponse } from 'next/server';
import { getProviderById, updateProvider } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// GET /admin/api/providers/[id] - Get a provider by ID
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

    const providerId = params.id;
    const provider = await getProviderById(providerId);

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Failed to get provider:', error);
    return NextResponse.json(
      { error: 'Failed to get provider' },
      { status: 500 },
    );
  }
}

// PATCH /admin/api/providers/[id] - Update a provider
export async function PATCH(
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

    const providerId = params.id;
    const provider = await getProviderById(providerId);

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 },
      );
    }

    const updates = await request.json();

    // Validate updates
    const validUpdates: Record<string, any> = {};

    if ('name' in updates && typeof updates.name === 'string') {
      validUpdates.name = updates.name;
    }

    if ('apiKey' in updates) {
      validUpdates.apiKey = updates.apiKey;
    }

    if ('baseUrl' in updates) {
      validUpdates.baseUrl = updates.baseUrl;
    }

    if ('enabled' in updates && typeof updates.enabled === 'boolean') {
      validUpdates.enabled = updates.enabled;
    }

    await updateProvider(providerId, validUpdates);

    const updatedProvider = await getProviderById(providerId);
    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Failed to update provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 },
    );
  }
}
