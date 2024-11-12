// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'From OpenAI',
  },
  {
    id: 'claude-3-5-sonnet-latest',
    label: 'Claude 3.5 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-latest',
    description: 'From Anthropic',
  },
  {
    id: 'llama-3.1-sonar-huge-128k-online',
    label: 'Perplexity LLama Online',
    apiIdentifier: 'llama-3.1-sonar-huge-128k-online',
    description: 'From Perplexity, has search capabilities',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'claude-3-5-sonnet-latest';
