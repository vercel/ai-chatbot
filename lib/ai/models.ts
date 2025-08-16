export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export type ModelProvider = 'openai' | 'anthropic' | 'google';
export type ModelCategory = 'fast' | 'balanced' | 'advanced' | 'reasoning';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  category: ModelCategory;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    codeGeneration: boolean;
    audio?: boolean;
    thinking?: boolean;
    realTime?: boolean;
  };
  pricing: {
    tier: 'low' | 'medium' | 'high' | 'premium';
    inputTokens: number; // per 1M tokens
    outputTokens: number; // per 1M tokens
  };
}

export const chatModels: Array<ChatModel> = [
  // OpenAI Fast Models
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient for simple tasks',
    provider: 'openai',
    category: 'fast',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 0.15,
      outputTokens: 0.6,
    },
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    description: 'Most efficient GPT-5 variant for high-volume tasks',
    provider: 'openai',
    category: 'fast',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 0.5,
      outputTokens: 2,
    },
  },
  
  // OpenAI Balanced Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Multimodal model with real-time audio, vision, and text',
    provider: 'openai',
    category: 'balanced',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
      audio: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 2.5,
      outputTokens: 10,
    },
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Smaller, faster GPT-5 variant with built-in reasoning',
    provider: 'openai',
    category: 'balanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 2,
      outputTokens: 8,
    },
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Specialized coding model with precise instruction following',
    provider: 'openai',
    category: 'balanced',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 3,
      outputTokens: 12,
    },
  },
  
  // OpenAI Advanced Models
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Unified model with built-in thinking and reasoning capabilities',
    provider: 'openai',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 5,
      outputTokens: 15,
    },
  },
  {
    id: 'gpt-5-chat-latest',
    name: 'GPT-5 Chat',
    description: 'GPT-5 optimized for conversational interactions',
    provider: 'openai',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 5,
      outputTokens: 15,
    },
  },
  
  // OpenAI Reasoning Models
  {
    id: 'o3',
    name: 'OpenAI o3',
    description: 'Most advanced reasoning model for complex problem solving',
    provider: 'openai',
    category: 'reasoning',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 20,
      outputTokens: 80,
    },
  },
  {
    id: 'o4-mini',
    name: 'OpenAI o4-mini',
    description: 'Fast, cost-efficient reasoning model optimized for speed',
    provider: 'openai',
    category: 'reasoning',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 8,
      outputTokens: 32,
    },
  },
  
  // Anthropic Models
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fastest Claude 3 model for simple tasks',
    provider: 'anthropic',
    category: 'fast',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 0.25,
      outputTokens: 1.25,
    },
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Latest fast Claude model with improved performance',
    provider: 'anthropic',
    category: 'fast',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 1,
      outputTokens: 5,
    },
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Latest Claude 3.5 with enhanced capabilities',
    provider: 'anthropic',
    category: 'balanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 3,
      outputTokens: 15,
    },
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Hybrid AI reasoning model with step-by-step thinking',
    provider: 'anthropic',
    category: 'reasoning',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 5,
      outputTokens: 25,
    },
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude 3 model for complex tasks',
    provider: 'anthropic',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 15,
      outputTokens: 75,
    },
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced enterprise model with significant improvements',
    provider: 'anthropic',
    category: 'balanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 8,
      outputTokens: 32,
    },
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Most powerful coding model with sustained performance',
    provider: 'anthropic',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 20,
      outputTokens: 100,
    },
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Most intelligent model with industry-leading coding capabilities',
    provider: 'anthropic',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 25,
      outputTokens: 125,
    },
  },
  
  // Google Models
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast multimodal model with long context',
    provider: 'google',
    category: 'fast',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 0.075,
      outputTokens: 0.3,
    },
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    description: 'Small efficient model designed for lower intelligence tasks',
    provider: 'google',
    category: 'fast',
    capabilities: {
      reasoning: false,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'low',
      inputTokens: 0.05,
      outputTokens: 0.2,
    },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced multimodal model with 2M context',
    provider: 'google',
    category: 'balanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 1.25,
      outputTokens: 5,
    },
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Next-gen Gemini with native tool use and 1M context',
    provider: 'google',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 1.5,
      outputTokens: 6,
    },
  },
  {
    id: 'gemini-2.0-flash-live',
    name: 'Gemini 2.0 Flash Live',
    description: 'Real-time bidirectional voice and video interactions',
    provider: 'google',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      audio: true,
      realTime: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 2,
      outputTokens: 8,
    },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'State-of-the-art thinking model with complex reasoning',
    provider: 'google',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'premium',
      inputTokens: 3,
      outputTokens: 12,
    },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Best price-performance with thinking capabilities',
    provider: 'google',
    category: 'advanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 1.5,
      outputTokens: 6,
    },
  },
];

// Legacy models for backward compatibility (shown when no providers configured)
export const legacyModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat Model',
    description: 'Primary model for all-purpose chat (GPT-5 Mini)',
    provider: 'openai',
    category: 'balanced',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
    },
    pricing: {
      tier: 'medium',
      inputTokens: 2,
      outputTokens: 8,
    },
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning Model',
    description: 'Advanced reasoning with step-by-step thinking (OpenAI o4-mini)',
    provider: 'openai',
    category: 'reasoning',
    capabilities: {
      reasoning: true,
      vision: true,
      codeGeneration: true,
      thinking: true,
    },
    pricing: {
      tier: 'high',
      inputTokens: 8,
      outputTokens: 32,
    },
  },
];

// All models including legacy for UI
export const allModels: Array<ChatModel> = [...chatModels, ...legacyModels];

// Legacy model mapping for backward compatibility
export const legacyModelMap: Record<string, string> = {
  'chat-model': 'gpt-5-mini',
  'chat-model-reasoning': 'o4-mini', // Updated to use latest OpenAI reasoning model
};
