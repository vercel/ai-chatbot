# Task: Update Model Configuration for LostMind AI

## Context
Building on Task 2.1, which integrated the Gemini models, this task focuses on enhancing the model configuration system to properly support the LostMind AI branding and capabilities. The model configuration determines how models are presented in the UI, what capabilities they expose, and their default parameters.

## Objective
Create a robust model configuration system that presents all five LostMind AI models with consistent branding, appropriate capability indicators, and optimized default parameters.

## Requirements
- Update model configuration system to support 5 models:
  - LostMind Lite (GPT-4o-mini)
  - LostMind Pro (GPT-4o)
  - LostMind Quantum (Gemini 2.5 Pro - Reasoning)
  - LostMind Vision Pro (Gemini 2.5 Pro - Vision)
  - LostMind Flash (Gemini 2.5 Flash)
- Implement capability indicators (reasoning, vision, chat, etc.)
- Create consistent model descriptions highlighting strengths
- Set appropriate default parameters for each model
- Ensure type safety with proper TypeScript interfaces

## File Locations
- Primary: `/lib/models.ts` - Update model configuration
- Primary: `/types/index.ts` - Define model configuration types
- Primary: `/config/models.ts` - Create/update model configuration
- Reference: `/components/model-selector.tsx` - How models appear in UI
- Reference: `/lib/hooks/use-chat.ts` - How models are used in chat

## Implementation Guidelines

### 1. Model Configuration Interface
Update or create the model configuration interface in `/types/index.ts`:

```typescript
export interface ModelCapability {
  id: string;
  name: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'google' | 'other';
  logoPath: string;
  maxTokens: number;
  temperature: number;
  capabilities: string[];
  isDefault?: boolean;
  contextWindow?: number;
  pricingPerMillion?: number;
  isReasoning?: boolean;
  isVision?: boolean;
}

export type ModelProviderType = 'openai' | 'google' | 'other';
```

### 2. Model Capabilities System
Create a capabilities configuration in `/config/capabilities.ts`:

```typescript
import { CodeIcon, BrainCircuitIcon, ImageIcon, SparklesIcon, MessageSquareIcon } from 'lucide-react';
import { ModelCapability } from '@/types';

export const modelCapabilities: Record<string, ModelCapability> = {
  chat: {
    id: 'chat',
    name: 'Chat',
    description: 'Conversational text responses',
    icon: MessageSquareIcon,
  },
  reasoning: {
    id: 'reasoning',
    name: 'Reasoning',
    description: 'Advanced problem-solving and analysis',
    icon: BrainCircuitIcon,
  },
  coding: {
    id: 'coding',
    name: 'Coding',
    description: 'Code generation and explanation',
    icon: CodeIcon,
  },
  vision: {
    id: 'vision',
    name: 'Vision',
    description: 'Image understanding and analysis',
    icon: ImageIcon,
  },
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'Extensive factual knowledge',
    icon: SparklesIcon,
  },
};
```

### 3. Update Models Configuration
Enhance the model definitions in `/lib/models.ts` with detailed information:

```typescript
import { ModelConfig } from '@/types';

export const models: ModelConfig[] = [
  {
    id: 'gpt-4o-mini',
    name: 'LostMind Lite',
    description: 'Fast responses for everyday tasks. Balances efficiency with quality.',
    provider: 'openai',
    logoPath: '/logos/lostmind-lite.svg',
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat', 'reasoning'],
    contextWindow: 128000,
    pricingPerMillion: 0.15,
    isDefault: true,
  },
  {
    id: 'gpt-4o',
    name: 'LostMind Pro',
    description: 'Our flagship model with enhanced reasoning and knowledge capabilities.',
    provider: 'openai',
    logoPath: '/logos/lostmind-pro.svg',
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat', 'reasoning', 'coding', 'knowledge'],
    contextWindow: 128000,
    pricingPerMillion: 5.00,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'LostMind Quantum',
    description: 'Advanced reasoning model for complex problem-solving and analysis.',
    provider: 'google',
    logoPath: '/logos/lostmind-quantum.svg',
    maxTokens: 8192,
    temperature: 0.2,
    capabilities: ['chat', 'reasoning', 'knowledge', 'coding'],
    contextWindow: 1000000,
    pricingPerMillion: 3.50,
    isReasoning: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'LostMind Vision Pro',
    description: 'Multimodal AI with vision capabilities for image understanding.',
    provider: 'google',
    logoPath: '/logos/lostmind-vision.svg',
    maxTokens: 8192,
    temperature: 0.7,
    capabilities: ['chat', 'vision', 'reasoning'],
    contextWindow: 1000000,
    pricingPerMillion: 3.50,
    isVision: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'LostMind Flash',
    description: 'Ultra-fast responses with high efficiency for rapid interactions.',
    provider: 'google',
    logoPath: '/logos/lostmind-flash.svg',
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat'],
    contextWindow: 128000,
    pricingPerMillion: 0.20,
  },
];

export const getModelById = (id: string): ModelConfig | undefined => {
  return models.find(model => model.id === id);
};

export const getDefaultModel = (): ModelConfig => {
  const defaultModel = models.find(model => model.isDefault);
  return defaultModel || models[0];
};
```

### 4. Helper Functions
Create model utility functions in `/lib/models.ts`:

```typescript
import { ModelConfig } from '@/types';
import { models } from '@/config/models';

export const getModelByNameAndProvider = (name: string, provider: string): ModelConfig | undefined => {
  return models.find(model => model.name === name && model.provider === provider);
};

export const getModelsByProvider = (provider: string): ModelConfig[] => {
  return models.filter(model => model.provider === provider);
};

export const getModelCapabilities = (model: ModelConfig) => {
  return model.capabilities.map(capId => modelCapabilities[capId]).filter(Boolean);
};
```

## Expected Outcome
- All 5 models have consistent configuration format
- Models display appropriate capability indicators in UI
- Descriptions are consistent with LostMind branding
- Model parameters are optimized for each use case
- Helper functions provide easy access to model details
- Type safety is maintained throughout the system

## Verification Steps
1. Verify that all models appear in the model selector with proper branding
2. Check that capability indicators display correctly
3. Test model parameter application when chatting
4. Confirm that helper functions return expected results
5. Ensure TypeScript shows no errors with model configuration

## Related Documentation
- AI SDK Documentation: https://sdk.vercel.ai/docs/api-reference
- LostMind AI Project Bible: See "Model Branding" section
- Lucide React Icons: https://lucide.dev/icons/
- React TypeScript Guide: https://react-typescript-cheatsheet.netlify.app/
