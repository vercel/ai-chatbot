// Define your models here.
export const models = [
  {
    label: 'Gemini 2.0 Flash',
    name: 'gemini-2.0-flash-001',
    description: 'Google Gemini model for fast and efficient responses',
  },
] as const;

export const DEFAULT_MODEL_NAME: Model['name'] = 'gemini-2.0-flash-001';

export type Model = (typeof models)[number];
