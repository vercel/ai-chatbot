import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';

// Get environment variable and validate
const envModel = process.env.OPENAI_MODEL?.trim();
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL?.trim();

// Use the OPENAI_MODEL environment variable directly - both OPENAI_BASE_URL and OPENAI_MODEL should always be provided
const OPENAI_MODEL = envModel || 'gpt2';

const MAX_COMPLETION_TOKENS = parseInt(process.env.MAX_COMPLETION_TOKENS || '1000', 10);

// Create a custom OpenAI provider with baseURL configuration
const openai = createOpenAI({
  baseURL: OPENAI_BASE_URL,
});

if (OPENAI_BASE_URL) {
  console.log('Created custom OpenAI provider with base URL:', OPENAI_BASE_URL);
} else {
  console.log('Using default OpenAI provider');
}

const myProvider = customProvider({
  languageModels: {
    'chat-model': openai(OPENAI_MODEL),
    'chat-model-reasoning': wrapLanguageModel({
      model: openai(OPENAI_MODEL),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai(OPENAI_MODEL),
    'artifact-model': openai(OPENAI_MODEL),
  },
  imageModels: {
    'small-model': openai.image('dall-e-3'),
  },
});

// Export configuration values for use in other parts of the application
export { myProvider, MAX_COMPLETION_TOKENS, OPENAI_MODEL, OPENAI_BASE_URL };
