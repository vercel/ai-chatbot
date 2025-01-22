import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { LanguageModelV1, experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  let model: LanguageModelV1;
  
  if (apiIdentifier.includes('claude')) {
    model = anthropic(apiIdentifier);
  } else if (apiIdentifier.includes('llama')) {
    const perplexity = createOpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai/',
    });
    model = perplexity(apiIdentifier);
  } else {
    model = openai(apiIdentifier);
  }

  return wrapLanguageModel({
    model,
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = openai.image('dall-e-3');
