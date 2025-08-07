export const DEFAULT_CHAT_MODEL: string = 'chat-gemini-2.0-flash-lite';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-nim-llama3-70b',
    name: 'NIM Llama3 70b',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'chat-llama3.3-70b-versatile',
    name: 'Llama 3.3 70b Versatile',
    description: 'For complex, multi-step tasks with versatility',
  },
  {
    id: 'chat-llama-4-scout-17b',
    name: 'LLAMA 4 Scout 17B 16e-instruct',
    description: 'LLAMA 4 Scout 17B 16e-instruct model, built by Meta',
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
    id: 'chat-nim-maverick-17b-128e',
    name: 'NIM llama Maverick 17B 128e-instruct',
    description: 'NIM LLAMA Maverick 17B 128e-instruct model, built by Meta',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Qwen QwQ 2b',
    description: 'Uses advanced reasoning and thinking for complex tasks',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120b',
    description: 'Open source model by OpenAI, hosted on Groq',
  },
];
