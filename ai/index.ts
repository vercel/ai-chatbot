import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { type Model } from '@/lib/model';

import { customMiddleware } from './custom-middleware';

export const customModel = (modelName: Model['name']) => {
  return wrapLanguageModel({
    model: openai(modelName),
    middleware: customMiddleware,
  });
};
