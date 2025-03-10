import { OpenAICompatibleChatSettings } from '@ai-sdk/openai-compatible';

export type GaladrielModelId = 'gpt-4-turbo' | (string & {});

export interface GaladrielSettings extends OpenAICompatibleChatSettings {
  // Add any custom settings here
  disableStreaming?: boolean;
}