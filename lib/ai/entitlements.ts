import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      // Legacy models
      'chat-model', 
      'chat-model-reasoning',
      // Basic models from each provider
      'xai-grok-3-mini-beta',
      'openai-gpt-3.5-turbo',
      'anthropic-claude-3-5-haiku-20241022',
      'google-gemini-1.0-pro',
      'google-gemini-1.5-flash',
      'mistral-small-latest',
      'togetherai-meta-llama-3.1-8b-instruct-turbo',
      'groq-llama-3.1-8b-instant',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // Legacy models
      'chat-model', 
      'chat-model-reasoning',
      // xAI models
      'xai-grok-2-1212',
      'xai-grok-2-vision-1212',
      'xai-grok-3-mini-beta',
      // OpenAI models
      'openai-gpt-3.5-turbo',
      'openai-gpt-4o-mini',
      'openai-gpt-4o',
      'openai-gpt-4-turbo',
      // Anthropic models
      'anthropic-claude-3-5-haiku-20241022',
      'anthropic-claude-3-sonnet-20240229',
      'anthropic-claude-3-5-sonnet-20241022',
      'anthropic-claude-3-opus-20240229',
      // Google models
      'google-gemini-1.0-pro',
      'google-gemini-1.5-flash',
      'google-gemini-1.5-pro',
      // Mistral models
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
      // Together.ai models
      'togetherai-meta-llama-3.1-8b-instruct-turbo',
      'togetherai-meta-llama-3.1-70b-instruct-turbo',
      'togetherai-mistralai-mixtral-8x7b-instruct-v0.1',
      'togetherai-codellama-34b-instruct',
      // Groq models
      'groq-llama-3.1-8b-instant',
      'groq-llama-3.1-70b-versatile',
      'groq-mixtral-8x7b-32768',
      'groq-gemma-7b-it',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   * Note: Premium tier would need to be added to UserType first
   */
};
