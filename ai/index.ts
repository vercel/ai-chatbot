import { google } from '@ai-sdk/google';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const customModel = () => {
  return wrapLanguageModel({
    model: google('gemini-2.0-flash-001') as any,
    middleware: customMiddleware,
  });
};
