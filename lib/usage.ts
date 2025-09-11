import type { LanguageModelUsage } from 'ai';
import type { UsageData } from 'tokenlens';

// Server-merged usage: base usage + TokenLens summary + optional modelId
export type AppUsage = LanguageModelUsage & UsageData & { modelId?: string };
