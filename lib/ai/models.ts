export const DEFAULT_CHAT_MODEL: string = 'openai-gpt4o';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'xai';
  modelId: string;
}

export const chatModels: Array<ChatModel> = [
  // OpenAI models
  {
    id: 'openai-gpt4o',
    name: 'GPT-4o (OpenAI)',
    description: 'Advanced vision-capable model',
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  {
    id: 'openai-o3mini',
    name: 'O3-mini (OpenAI)',
    description: 'Fast STEM reasoning model',
    provider: 'openai',
    modelId: 'o3-mini',
  },
  {
    id: 'openai-reasoning',
    name: 'Reasoning (OpenAI)',
    description: 'Advanced reasoning capabilities',
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  
  // xAI models
  {
    id: 'xai-grok2',
    name: 'Grok-2 (xAI)',
    description: 'General purpose chat model',
    provider: 'xai',
    modelId: 'grok-2-1212',
  },
  {
    id: 'xai-grok2-vision',
    name: 'Grok-2 Vision (xAI)',
    description: 'Vision-capable model',
    provider: 'xai',
    modelId: 'grok-2-vision-1212',
  },
  {
    id: 'xai-grok3-mini',
    name: 'Grok-3 Mini (xAI)',
    description: 'Compact reasoning model',
    provider: 'xai',
    modelId: 'grok-3-mini-beta',
  },
];

// Helper function to get the model's provider
export function getModelProvider(modelId: string): 'openai' | 'xai' {
  const model = chatModels.find(m => m.id === modelId);
  return model?.provider || 'openai';
}

// Define image models for each provider
export interface ImageModel {
  id: string;
  provider: 'openai' | 'xai';
  modelId: string;
  size?: string;
  quality?: 'standard' | 'hd';
}

export const imageModels: Record<'openai' | 'xai', ImageModel> = {
  openai: {
    id: 'openai-dalle3',
    provider: 'openai',
    modelId: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard'
  },
  xai: {
    id: 'xai-grok2-image',
    provider: 'xai',
    modelId: 'grok-2-image'
  }
};
