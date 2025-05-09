import 'server-only';
import { NextResponse } from 'next/server';
import {
  getProviderById,
  getProviderModels,
  updateProviderModel,
  createProviderModel,
} from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// GET /admin/api/providers/[id]/models - Get all models for a provider
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

    const models = await getProviderModels(providerId);
    return NextResponse.json(models);
  } catch (error) {
    console.error('Failed to get provider models:', error);
    return NextResponse.json(
      { error: 'Failed to get provider models' },
      { status: 500 },
    );
  }
}

// POST /admin/api/providers/[id]/models - Create a new model for a provider
export async function POST(
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

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.modelId) {
      return NextResponse.json(
        { error: 'Name and modelId are required' },
        { status: 400 },
      );
    }

    const newModel = await createProviderModel(
      providerId,
      data.name,
      data.modelId,
      data.isChat ?? true,
      data.isImage ?? false,
      data.enabled ?? true,
      data.config,
    );

    return NextResponse.json(newModel);
  } catch (error) {
    console.error('Failed to create provider model:', error);
    return NextResponse.json(
      { error: 'Failed to create provider model' },
      { status: 500 },
    );
  }
}
