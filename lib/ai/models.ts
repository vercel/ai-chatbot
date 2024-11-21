// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'claude-3-5-sonnet-latest',
    label: 'Claude 3.5 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-latest',
    description: 'From Anthropic. Best for most tasks.',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'From OpenAI. Good for most tasks.',
  },
  {
    id: 'llama-3.1-sonar-huge-128k-online',
    label: 'Perplexity LLama Online',
    apiIdentifier: 'llama-3.1-sonar-huge-128k-online',
    description: 'From Perplexity. Has access to the web.',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'claude-3-5-sonnet-latest';
