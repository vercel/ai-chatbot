import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

/**
 * OpenAI Provider Configuration
 *
 * All models use gpt-5-mini, which supports:
 * - Image inputs (multimodal vision capabilities)
 * - Tool usage (function calling)
 * - Object generation (structured outputs)
 * - Reasoning capabilities (with reasoning middleware)
 *
 * Provider options can be configured at call time via providerOptions:
 * @see lib/ai/openai-config.ts for helper functions and available options
 *
 * Available provider options include:
 * - reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
 * - reasoningSummary: 'auto' | 'detailed' (for reasoning models)
 * - textVerbosity: 'low' | 'medium' | 'high'
 * - serviceTier: 'auto' | 'flex' | 'priority' | 'default'
 * - parallelToolCalls: boolean
 * - maxToolCalls: number
 * - And more (see OpenAIResponsesProviderOptions type)
 */
export const myProvider = isTestEnvironment
  ? (() => {
    const {
      artifactModel,
      chatModel,
      reasoningModel,
      titleModel,
    } = require("./models.mock");
    return customProvider({
      languageModels: {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      },
    });
  })()
  : customProvider({
    languageModels: {
      // Default chat model with vision and text capabilities
      "chat-model": openai("gpt-5-mini"),

      // Reasoning model with chain-of-thought reasoning extraction
      // Uses extractReasoningMiddleware to extract reasoning from <think> tags
      "chat-model-reasoning": wrapLanguageModel({
        model: openai("gpt-5-mini"),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      }),

      // Title generation model (optimized for concise output)
      "title-model": openai("gpt-5-mini"),

      // Artifact/document generation model
      "artifact-model": openai("gpt-5-mini"),
    },
  });
