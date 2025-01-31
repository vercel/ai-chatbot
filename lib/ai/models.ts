// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider: 'openai' | 'fireworks';
}

export const models: Array<Model> = [
  {
    id: 'deepseek-r1',
    label: 'DeepSeek R1 (Hosted by Fireworks AI)',
    apiIdentifier: 'accounts/fireworks/models/deepseek-r1',
    description: 'A reasoning model that can handle the most complex tasks',
    provider: 'fireworks',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
    provider: 'openai',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
    provider: 'openai',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'deepseek-r1';
