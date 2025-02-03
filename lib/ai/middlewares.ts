import { extractReasoningMiddleware, type LanguageModelV1Middleware } from 'ai';

export const emptyMiddleware: LanguageModelV1Middleware = {};

export const middlewareByModelId: Record<string, LanguageModelV1Middleware> = {
  'small-model': emptyMiddleware,
  'large-model': emptyMiddleware,
  'reasoning-model': extractReasoningMiddleware({ tagName: 'think' }),
};
