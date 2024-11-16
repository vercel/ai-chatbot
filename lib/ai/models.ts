// Define your models here.

export type ModelProvider = 'google' | 'openai' | 'anthropic';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider: ModelProvider;
  fallbackResponse?: string;
}

export const models: Array<Model> = [
  {
    id: 'gemini-flash',
    label: 'Gemini 1.5 Flash',
    apiIdentifier: 'gemini-1.5-flash',
    description: 'Fastest Google AI model, optimized for speed',
    provider: 'google',
    fallbackResponse: "I apologize, but I couldn't process that request. Please try again or rephrase your question.",
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
    provider: 'openai',
    fallbackResponse: "I'm having trouble processing your request at the moment. Please try again.",
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
    provider: 'openai',
    fallbackResponse: "I apologize, but I'm experiencing difficulties. Please try again shortly.",
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gemini-flash';

export const getModelById = (id: string): Model | undefined =>
  models.find(model => model.id === id);

export const getModelByProvider = (provider: ModelProvider): Model[] =>
  models.filter(model => model.provider === provider);
