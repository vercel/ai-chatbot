import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google'; // Import Google provider
import { groq } from '@ai-sdk/groq'; // Import Groq provider
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // Keep Gemini models (requires GOOGLE_API_KEY environment variable)
        'gemini-pro': google('gemini-pro'),
        'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
        'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
        // Keep Groq models (requires GROQ_API_KEY environment variable)
        'llama3-8b-8192': groq('llama3-8b-8192'),
        'llama3-70b-8192': groq('llama3-70b-8192'),
        'mixtral-8x7b-32768': groq('mixtral-8x7b-32768'),
        'gemma-7b-it': groq('gemma-7b-it'),
      },
      imageModels: {
        // Keep Gemini image models if needed
        'gemini-pro-vision': google('gemini-pro-vision'),
      },
    });
