export const DEFAULT_CHAT_MODEL: string = 'chat-llama3-70b';

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
    id: 'chat-llama3.3-70b-specdec',
    name: 'Llama 3.3 70b SpecDec',
    description: 'For complex, multi-step tasks with specialized decoding',
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
