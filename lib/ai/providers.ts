import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

import { createGroq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const groq = createGroq({
  baseURL:
    'https://gateway.ai.cloudflare.com/v1/b4ca0337fb21e846c53e1f2611ba436c/chatbot-ai/groq',
});

const nim = createOpenAICompatible({
  name: 'nim',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.NIM_API_KEY}`,
  },
});

export const myProvider = customProvider({
  languageModels: {
    'chat-nim-llama3-70b': nim('meta/llama-3.3-70b-instruct'),
    'chat-llama3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
    'chat-llama-4-scout-17b': groq('meta-llama/llama-4-scout-17b-16e-instruct'),
    'chat-gemini-2.0-flash-lite': google('gemini-2.0-flash-lite'),
    'chat-gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'chat-gemini-2.0-flash': google('gemini-2.0-flash'),
    'chat-gemini-2.0-flash-search': google('gemini-2.0-flash', {
      useSearchGrounding: true,
    }),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('qwen-qwq-32b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': google('gemini-1.5-flash-8b'),
    'openai/gpt-oss-120b': groq('openai/gpt-oss-120b'),
  },
  imageModels: {},
});
