export interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  models: ChatModel[];
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  providerId: string;
  capabilities: string[];
  contextWindow: number;
  pricing: 'free' | 'paid' | 'premium';
}

export const providers: Provider[] = [
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok models by xAI',
    icon: 'X',
    models: [
      {
        id: 'xai-grok-2-vision-1212',
        name: 'Grok-2 Vision',
        description: 'Advanced multimodal model with vision capabilities',
        providerId: 'xai',
        capabilities: ['vision', 'reasoning', 'code'],
        contextWindow: 128000,
        pricing: 'paid',
      },
      {
        id: 'xai-grok-2-1212',
        name: 'Grok-2',
        description: 'High-performance language model',
        providerId: 'xai',
        capabilities: ['reasoning', 'code', 'fast'],
        contextWindow: 128000,
        pricing: 'paid',
      },
      {
        id: 'xai-grok-3-mini-beta',
        name: 'Grok-3 Mini',
        description: 'Compact model with reasoning capabilities',
        providerId: 'xai',
        capabilities: ['reasoning', 'fast'],
        contextWindow: 32000,
        pricing: 'paid',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models by OpenAI',
    icon: 'O',
    models: [
      {
        id: 'openai-gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable multimodal model',
        providerId: 'openai',
        capabilities: ['vision', 'reasoning', 'code', 'audio'],
        contextWindow: 128000,
        pricing: 'premium',
      },
      {
        id: 'openai-gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable multimodal model',
        providerId: 'openai',
        capabilities: ['vision', 'reasoning', 'code', 'fast'],
        contextWindow: 128000,
        pricing: 'paid',
      },
      {
        id: 'openai-gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'High-performance model with large context',
        providerId: 'openai',
        capabilities: ['reasoning', 'code', 'vision'],
        contextWindow: 128000,
        pricing: 'premium',
      },
      {
        id: 'openai-gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model',
        providerId: 'openai',
        capabilities: ['fast', 'code'],
        contextWindow: 16385,
        pricing: 'paid',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models by Anthropic',
    icon: 'A',
    models: [
      {
        id: 'anthropic-claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model with vision capabilities',
        providerId: 'anthropic',
        capabilities: ['vision', 'reasoning', 'code', 'analysis'],
        contextWindow: 200000,
        pricing: 'premium',
      },
      {
        id: 'anthropic-claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fast and affordable model',
        providerId: 'anthropic',
        capabilities: ['fast', 'reasoning', 'code'],
        contextWindow: 200000,
        pricing: 'paid',
      },
      {
        id: 'anthropic-claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most powerful model for complex tasks',
        providerId: 'anthropic',
        capabilities: ['reasoning', 'code', 'analysis', 'creative'],
        contextWindow: 200000,
        pricing: 'premium',
      },
      {
        id: 'anthropic-claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        providerId: 'anthropic',
        capabilities: ['reasoning', 'code', 'analysis'],
        contextWindow: 200000,
        pricing: 'paid',
      },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini models by Google',
    icon: 'G',
    models: [
      {
        id: 'google-gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced multimodal model with large context',
        providerId: 'google',
        capabilities: ['vision', 'reasoning', 'code', 'audio'],
        contextWindow: 2000000,
        pricing: 'premium',
      },
      {
        id: 'google-gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast multimodal model',
        providerId: 'google',
        capabilities: ['vision', 'fast', 'code'],
        contextWindow: 1000000,
        pricing: 'paid',
      },
      {
        id: 'google-gemini-1.0-pro',
        name: 'Gemini 1.0 Pro',
        description: 'Reliable text-only model',
        providerId: 'google',
        capabilities: ['reasoning', 'code'],
        contextWindow: 32000,
        pricing: 'free',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral AI models',
    icon: 'M',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Most capable model for complex reasoning',
        providerId: 'mistral',
        capabilities: ['reasoning', 'code', 'multilingual'],
        contextWindow: 128000,
        pricing: 'premium',
      },
      {
        id: 'mistral-medium-latest',
        name: 'Mistral Medium',
        description: 'Balanced performance model',
        providerId: 'mistral',
        capabilities: ['reasoning', 'code'],
        contextWindow: 32000,
        pricing: 'paid',
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Fast and efficient model',
        providerId: 'mistral',
        capabilities: ['fast', 'code'],
        contextWindow: 32000,
        pricing: 'paid',
      },
    ],
  },
  {
    id: 'togetherai',
    name: 'Together.ai',
    description: 'Open-source models via Together.ai',
    icon: 'T',
    models: [
      {
        id: 'togetherai-meta-llama-3.1-70b-instruct-turbo',
        name: 'Llama 3.1 70B',
        description: 'Large open-source model by Meta',
        providerId: 'togetherai',
        capabilities: ['reasoning', 'code', 'multilingual'],
        contextWindow: 131072,
        pricing: 'paid',
      },
      {
        id: 'togetherai-meta-llama-3.1-8b-instruct-turbo',
        name: 'Llama 3.1 8B',
        description: 'Efficient open-source model',
        providerId: 'togetherai',
        capabilities: ['fast', 'code'],
        contextWindow: 131072,
        pricing: 'paid',
      },
      {
        id: 'togetherai-mistralai-mixtral-8x7b-instruct-v0.1',
        name: 'Mixtral 8x7B',
        description: 'Mixture of experts model',
        providerId: 'togetherai',
        capabilities: ['reasoning', 'code', 'multilingual'],
        contextWindow: 32768,
        pricing: 'paid',
      },
      {
        id: 'togetherai-codellama-34b-instruct',
        name: 'CodeLlama 34B',
        description: 'Specialized code generation model',
        providerId: 'togetherai',
        capabilities: ['code', 'reasoning'],
        contextWindow: 16384,
        pricing: 'paid',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference models',
    icon: 'Q',
    models: [
      {
        id: 'groq-llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        description: 'Large model with ultra-fast inference',
        providerId: 'groq',
        capabilities: ['reasoning', 'code', 'fast'],
        contextWindow: 131072,
        pricing: 'paid',
      },
      {
        id: 'groq-llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Lightning-fast small model',
        providerId: 'groq',
        capabilities: ['fast', 'code'],
        contextWindow: 131072,
        pricing: 'paid',
      },
      {
        id: 'groq-mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Fast mixture of experts model',
        providerId: 'groq',
        capabilities: ['reasoning', 'code', 'fast'],
        contextWindow: 32768,
        pricing: 'paid',
      },
      {
        id: 'groq-gemma-7b-it',
        name: 'Gemma 7B',
        description: 'Efficient Google model with fast inference',
        providerId: 'groq',
        capabilities: ['fast', 'code'],
        contextWindow: 8192,
        pricing: 'paid',
      },
    ],
  },
];

export const allModels: ChatModel[] = providers.flatMap(provider => provider.models);

export const getProviderById = (id: string): Provider | undefined => 
  providers.find(provider => provider.id === id);

export const getModelById = (id: string): ChatModel | undefined => 
  allModels.find(model => model.id === id);

export const getModelsByProvider = (providerId: string): ChatModel[] => 
  allModels.filter(model => model.providerId === providerId);

export const capabilityColors: Record<string, string> = {
  vision: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reasoning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  code: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fast: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  audio: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  analysis: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  creative: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  multilingual: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export const pricingColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};
