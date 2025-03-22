export const DEFAULT_CHAT_MODEL: string = 'chat-gemini-2.0-flash-lite';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-llama3-70b',
    name: 'Llama3 70b',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'chat-llama3.3-70b-versatile',
    name: 'Llama 3.3 70b Versatile',
    description: 'For complex, multi-step tasks with versatility',
  },
  {
    id: 'chat-gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'LLM model, built by Google',
  },
  {
    id: 'chat-gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    description:
      'Built by Google, It is a small model designed for lower intelligence tasks.',
  },
  {
    id: 'chat-gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description:
      'Built by Google, Next generation features, speed, thinking, realtime streaming',
  },
  {
    id: 'chat-gemini-2.0-flash-search',
    name: 'Gemini 2.0 Flash + Web Search',
    description:
      'Built by Google, Next generation features, speed, thinking, realtime streaming + Google Search',
  },
  {
    id: 'chat-qwen2.5-32b',
    name: 'Qwen 2.5 32b',
    description: 'For simple, single-step tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'DeepSeek Qwen 32b Reasoning',
    description: 'Uses advanced reasoning and thinking for complex tasks',
  },
];
