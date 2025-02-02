import { openai } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import { experimental_createProviderRegistry } from 'ai';

export const registry = experimental_createProviderRegistry({
  openai,
  fireworks,
});

interface ChatModel {
  id: string;
  modelByProvider: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'small-model',
    modelByProvider: 'openai:gpt-4o-mini',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'large-model',
    modelByProvider: 'openai:gpt-4o',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'reasoning-model',
    modelByProvider: 'fireworks:accounts/fireworks/models/deepseek-r1',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];

export const DEFAULT_CHAT_MODEL: string = 'small-model';

export const imageGenerationModel = openai.image('dall-e-3');
