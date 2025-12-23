"use client";

import type { ChatModel } from "@/lib/ai/models";

export interface EnhancedModelInfo extends ChatModel {
  provider?: "Google" | "OpenAI" | "Anthropic";
  speed?: "fast" | "medium" | "slow";
  cost?: "low" | "medium" | "high";
  costPerMillion?: { input: number; output: number };
  capabilities?: string[];
  contextWindow?: number;
  iconType?: "zap" | "brain" | "star" | "sparkles" | "clock" | "dollar";
  apiId?: string; // Actual API model identifier
}

export const ENHANCED_MODEL_CATALOG: EnhancedModelInfo[] = [
  {
    id: "chat-model",
    name: "Gemini 2.0 Flash",
    description: "Fast and capable multimodal model with vision capabilities",
    provider: "Google",
    speed: "fast",
    cost: "low",
    costPerMillion: { input: 0.075, output: 0.30 },
    capabilities: ["vision", "multimodal", "fast", "128k context"],
    contextWindow: 128_000,
    iconType: "zap",
    apiId: "gemini-2.0-flash-exp",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.0 Flash Thinking",
    description: "Experimental thinking model with extended reasoning capabilities",
    provider: "Google",
    speed: "medium",
    cost: "medium",
    costPerMillion: { input: 0.15, output: 0.60 },
    capabilities: ["reasoning", "thinking", "analysis", "128k context"],
    contextWindow: 128_000,
    iconType: "brain",
    apiId: "gemini-2.0-flash-thinking-exp",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Most capable GPT-4 model with 128K context",
    provider: "OpenAI",
    speed: "medium",
    cost: "high",
    costPerMillion: { input: 10.0, output: 30.0 },
    capabilities: ["reasoning", "coding", "analysis", "128k context"],
    contextWindow: 128_000,
    iconType: "star",
    apiId: "gpt-4-turbo-preview",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's most advanced multimodal model",
    provider: "OpenAI",
    speed: "fast",
    cost: "medium",
    costPerMillion: { input: 5.0, output: 15.0 },
    capabilities: ["multimodal", "vision", "coding", "128k context"],
    contextWindow: 128_000,
    iconType: "sparkles",
    apiId: "gpt-4o",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Most intelligent Claude model with extended context",
    provider: "Anthropic",
    speed: "medium",
    cost: "high",
    costPerMillion: { input: 3.0, output: 15.0 },
    capabilities: ["reasoning", "coding", "analysis", "200k context"],
    contextWindow: 200_000,
    iconType: "brain",
    apiId: "claude-3-5-sonnet-20241022",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Top-tier performance for complex tasks",
    provider: "Anthropic",
    speed: "slow",
    cost: "high",
    costPerMillion: { input: 15.0, output: 75.0 },
    capabilities: ["reasoning", "creative", "analysis", "200k context"],
    contextWindow: 200_000,
    iconType: "sparkles",
    apiId: "claude-3-opus-20240229",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Fastest Claude model for simple tasks",
    provider: "Anthropic",
    speed: "fast",
    cost: "low",
    costPerMillion: { input: 0.25, output: 1.25 },
    capabilities: ["fast", "efficient", "200k context"],
    contextWindow: 200_000,
    iconType: "zap",
    apiId: "claude-3-haiku-20240307",
  },
];

export const SPEED_CONFIG = {
  fast: {
    label: "Fast",
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    iconType: "zap" as const,
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    iconType: "clock" as const,
  },
  slow: {
    label: "Slow",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    iconType: "clock" as const,
  },
};

export const COST_CONFIG = {
  low: {
    label: "Low Cost",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconType: "dollar" as const,
  },
  medium: {
    label: "Medium Cost",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    iconType: "dollar" as const,
  },
  high: {
    label: "High Cost",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    iconType: "dollar" as const,
  },
};

export const PROVIDER_CONFIG = {
  Google: {
    color: "bg-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  OpenAI: {
    color: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  Anthropic: {
    color: "bg-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
  },
};

export function getModelInfo(modelId: string): EnhancedModelInfo | undefined {
  return ENHANCED_MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getModelsByProvider(
  provider: "Google" | "OpenAI" | "Anthropic"
): EnhancedModelInfo[] {
  return ENHANCED_MODEL_CATALOG.filter((m) => m.provider === provider);
}

export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelInfo(modelId);
  if (!model?.costPerMillion) {
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * model.costPerMillion.input;
  const outputCost = (outputTokens / 1_000_000) * model.costPerMillion.output;

  return inputCost + outputCost;
}
