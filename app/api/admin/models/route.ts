import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getModelSettings,
  upsertModelSettings,
  isUserAdmin,
} from '@/lib/db/queries';
import { allModels } from '@/lib/ai/models';

// GET /api/admin/models - Get all models with their settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all model settings from database
    const dbSettings = await getModelSettings();
    const settingsMap = new Map(dbSettings?.map(s => [s.modelId, s]) || []);

    // Combine with actual model definitions
    const modelsWithSettings = allModels.map(model => ({
      ...model,
      settings: settingsMap.get(model.id) || {
        modelId: model.id,
        isEnabled: true,
        isHidden: false,
        customName: null,
        customDescription: null,
        maxTier: null,
      }
    }));

    return NextResponse.json({ models: modelsWithSettings });
  } catch (error) {
    console.error('Failed to get models:', error);
    return NextResponse.json(
      { error: 'Failed to get models' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/models - Update model settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { modelId, ...settings } = await request.json();

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Verify the model exists in our definitions
    const modelExists = allModels.some(m => m.id === modelId);
    if (!modelExists) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    const updatedSettings = await upsertModelSettings({
      modelId,
      ...settings,
    });

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Failed to update model settings:', error);
    return NextResponse.json(
      { error: 'Failed to update model settings' },
      { status: 500 }
    );
  }
}