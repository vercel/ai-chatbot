import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';

export const myProvider = customProvider({
  languageModels: {
    'chat-model': openai('gpt-4o-mini'),
    'chat-model-reasoning': wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4o-mini'),
    'artifact-model': openai('gpt-4o-mini'),
    'chat-model-advanced': openai('gpt-4o'),
  },
});
