// https://docs.mistral.ai/platform/endpoints/
export type CustomChatModelId =
  | 'flowise'
  | (string & {});

export interface CustomChatSettings {
  /**
Whether to inject a safety prompt before all conversations.

Defaults to `false`.
   */
  safePrompt?: boolean;
}