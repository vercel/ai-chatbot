import 'server-only';
import { NextResponse } from 'next/server';
import { updateProviderModel } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// PATCH /admin/api/providers/models/[id] - Update a model
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

    const modelId = params.id;
    const updates = await request.json();

    // Validate updates
    const validUpdates: Record<string, any> = {};

    if ('name' in updates && typeof updates.name === 'string') {
      validUpdates.name = updates.name;
    }

    if ('modelId' in updates && typeof updates.modelId === 'string') {
      validUpdates.modelId = updates.modelId;
    }

    if ('enabled' in updates && typeof updates.enabled === 'boolean') {
      validUpdates.enabled = updates.enabled;
    }

    if ('config' in updates) {
      validUpdates.config = updates.config;
    }

    await updateProviderModel(modelId, validUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update provider model:', error);
    return NextResponse.json(
      { error: 'Failed to update provider model' },
      { status: 500 },
    );
  }
}
