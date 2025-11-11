import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";

/**
 * OpenAI Provider Options Configuration
 *
 * This file documents and provides helper functions for OpenAI provider options
 * that can be used with gpt-5-mini and other OpenAI models.
 *
 * Provider options are passed to generateText, streamText, generateObject, etc.
 * via the `providerOptions` parameter:
 *
 * @example
 * ```ts
 * await streamText({
 *   model: myProvider.languageModel("chat-model"),
 *   prompt: "Hello",
 *   providerOptions: {
 *     openai: getDefaultOpenAIOptions(),
 *   },
 * });
 * ```
 */

/**
 * Default OpenAI provider options for gpt-5-mini
 *
 * These options are optimized for the default chat model.
 * You can override specific options when calling generateText/streamText.
 */
export const getDefaultOpenAIOptions = (): OpenAIResponsesProviderOptions => ({
  // Parallel tool calls - enables faster tool execution
  parallelToolCalls: true,

  // Store generation for OpenAI's platform (useful for distillation)
  store: true,

  // Service tier - 'flex' for 50% cheaper processing with increased latency
  // 'priority' for faster processing (Enterprise access required)
  // 'auto' lets OpenAI choose (default)
  serviceTier: "auto",

  // Text verbosity - controls response length
  // 'low' for concise, 'medium' (default) for balanced, 'high' for verbose
  textVerbosity: "medium",

  // Strict JSON schema validation
  strictJsonSchema: false,
});

/**
 * OpenAI provider options for reasoning models
 *
 * Use this for chat-model-reasoning to enable reasoning capabilities.
 * Set reasoningSummary to 'detailed' for full reasoning content visibility.
 */
export const getReasoningOpenAIOptions = (): OpenAIResponsesProviderOptions => ({
  ...getDefaultOpenAIOptions(),

  // Reasoning effort - determines amount of reasoning performed
  // 'minimal' | 'low' | 'medium' (default) | 'high'
  reasoningEffort: "medium",

  // Reasoning summary - enables reasoning output visibility
  // 'auto' for condensed summary, 'detailed' for comprehensive reasoning
  // 'detailed' is required to see the actual reasoning content streamed
  reasoningSummary: "detailed",

  // Max tool calls - limit total tool calls across all tools
  maxToolCalls: 5,
});

/**
 * OpenAI provider options for title generation
 *
 * Optimized for concise title generation.
 */
export const getTitleOpenAIOptions = (): OpenAIResponsesProviderOptions => ({
  ...getDefaultOpenAIOptions(),

  // Use low verbosity for shorter, more concise titles
  textVerbosity: "low",

  // Disable tool calls for title generation
  parallelToolCalls: false,
});

/**
 * OpenAI provider options for artifact generation
 *
 * Optimized for document and artifact creation.
 */
export const getArtifactOpenAIOptions = (): OpenAIResponsesProviderOptions => ({
  ...getDefaultOpenAIOptions(),

  // Use medium verbosity for balanced artifact content
  textVerbosity: "medium",

  // Enable parallel tool calls for faster artifact generation
  parallelToolCalls: true,
});

/**
 * Available OpenAI Provider Options Reference:
 *
 * - parallelToolCalls: boolean - Whether to use parallel tool calls (default: true)
 * - store: boolean - Whether to store the generation (default: true)
 * - maxToolCalls: number - Maximum number of total tool calls (default: undefined)
 * - metadata: Record<string, string> - Additional metadata to store
 * - previousResponseId: string - ID of previous response for conversation continuation
 * - instructions: string - Instructions for the model
 * - user: string - Unique identifier for end-user (for abuse monitoring)
 * - reasoningEffort: 'minimal' | 'low' | 'medium' | 'high' - Reasoning effort (default: 'medium')
 * - reasoningSummary: 'auto' | 'detailed' - Controls reasoning process visibility
 * - strictJsonSchema: boolean - Use strict JSON schema validation (default: false)
 * - serviceTier: 'auto' | 'flex' | 'priority' | 'default' - Service tier (default: 'auto')
 *   - 'flex': 50% cheaper processing with increased latency (available for o3, o4-mini, gpt-5)
 *   - 'priority': Faster processing with Enterprise access (available for gpt-4, gpt-5, gpt-5-mini, o3, o4-mini)
 * - textVerbosity: 'low' | 'medium' | 'high' - Controls response verbosity (default: 'medium')
 * - include: string[] - Additional content to include (e.g., ['file_search_call.results'])
 * - truncation: string - Truncation strategy ('auto' or 'disabled')
 * - promptCacheKey: string - Cache key for manual prompt caching control
 * - safetyIdentifier: string - Stable identifier for abuse detection
 */

