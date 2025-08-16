import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';
import { allModels } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
  allowedPricingTiers: Array<'low' | 'medium' | 'high' | 'premium'>;
  maxCostPerMessage?: number; // in dollars
}

// Static model filtering - provider availability will be checked server-side
const getAvailableModelIds = (allowedTiers: Array<'low' | 'medium' | 'high' | 'premium'>): Array<ChatModel['id']> => {
  const availableModels = allModels
    .filter(model => allowedTiers.includes(model.pricing.tier))
    .map(model => model.id);
  
  // Debug logging for entitlements
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🎫 Entitlements Debug for tiers: [${allowedTiers.join(', ')}]`);
    console.log(`📊 Total models in allModels: ${allModels.length}`);
    
    const modelsByTier = allModels.reduce((acc, model) => {
      acc[model.pricing.tier] = (acc[model.pricing.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Models by pricing tier:', modelsByTier);
    console.log(`✅ Models matching allowed tiers: ${availableModels.length}`);
    console.log(`📝 Available model IDs: ${availableModels.slice(0, 10).join(', ')}${availableModels.length > 10 ? '...' : ''}`);
  }
    
  return availableModels;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account - access to low and medium tier models for better experience
   */
  guest: {
    maxMessagesPerDay: 20,
    allowedPricingTiers: ['low', 'medium'],
    maxCostPerMessage: 0.05,
    get availableChatModelIds() {
      return getAvailableModelIds(this.allowedPricingTiers);
    },
  },

  /*
   * For users with an account - access to low, medium, and high tier models
   */
  regular: {
    maxMessagesPerDay: 100,
    allowedPricingTiers: ['low', 'medium', 'high'],
    maxCostPerMessage: 0.10,
    get availableChatModelIds() {
      return getAvailableModelIds(this.allowedPricingTiers);
    },
  },

  /*
   * For users with a paid membership - access to all models
   */
  premium: {
    maxMessagesPerDay: 1000,
    allowedPricingTiers: ['low', 'medium', 'high', 'premium'],
    maxCostPerMessage: 0.20,
    get availableChatModelIds() {
      return getAvailableModelIds(this.allowedPricingTiers);
    },
  },
};

// Helper function to get model cost estimate
export const getModelCostEstimate = (modelId: string, inputTokens: number, outputTokens: number): number => {
  const model = allModels.find(m => m.id === modelId);
  if (!model) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * model.pricing.inputTokens;
  const outputCost = (outputTokens / 1_000_000) * model.pricing.outputTokens;
  
  return inputCost + outputCost;
};

// Helper function to check if user can access a model
export const canUserAccessModel = (userType: UserType, modelId: string): boolean => {
  const entitlements = entitlementsByUserType[userType];
  return entitlements.availableChatModelIds.includes(modelId);
};
