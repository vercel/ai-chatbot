import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getModelSettings } from '@/lib/db/queries';
import { allModels } from '@/lib/ai/models';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

// GET /api/models/available - Get models available to current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userType = session.user.type;
    const isAdmin = session.user.isAdmin;
    const { availableChatModelIds, allowedPricingTiers } = entitlementsByUserType[userType];

    // Get admin model settings
    const dbSettings = await getModelSettings();
    const settingsMap = new Map(dbSettings?.map(s => [s.modelId, s]) || []);

    // Filter models based on:
    // 1. User tier access (admins bypass this)
    // 2. Admin enabled/disabled status
    // 3. Admin tier restrictions (admins bypass this unless explicitly set)
    const availableModels = allModels.filter(model => {
      const settings = settingsMap.get(model.id);
      
      // Check if admin has disabled this model
      if (settings?.isEnabled === false) {
        return false;
      }

      // For non-admins, apply tier restrictions
      if (!isAdmin) {
        // Check admin tier restriction (if set, it overrides the default)
        const effectiveTier = settings?.maxTier || model.pricing.tier;
        if (!allowedPricingTiers.includes(effectiveTier)) {
          return false;
        }

        // Check user's model access list
        if (!availableChatModelIds.includes(model.id)) {
          return false;
        }
      } else if (settings?.maxTier && !allowedPricingTiers.includes(settings.maxTier)) {
        // For admins, only respect explicit tier restrictions from admin settings
        return false;
      }

      return true;
    }).map(model => {
      const settings = settingsMap.get(model.id);
      
      // Apply admin customizations
      return {
        ...model,
        name: settings?.customName || model.name,
        description: settings?.customDescription || model.description,
        isHidden: settings?.isHidden || false,
        pricing: {
          ...model.pricing,
          tier: settings?.maxTier || model.pricing.tier,
        }
      };
    });

    return NextResponse.json({ models: availableModels });
  } catch (error) {
    console.error('Failed to get available models:', error);
    return NextResponse.json(
      { error: 'Failed to get available models' },
      { status: 500 }
    );
  }
}