import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { InferUITool, UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface EnhancedChatMessage extends ChatMessage {
  metadata?: MessageMetadata & {
    original?: any;
    enhanced?: any;
    enhancements?: Enhancement[];
  };
}

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

// Prompt Enhancement Types
export interface PromptAnalysis {
  intent: Intent;
  sentiment: Sentiment;
  vaguenessLevel: VaguenessLevel;
  contextGaps: ContextGaps;
  promptType: PromptType;
  keywords: string[];
  complexity: ComplexityLevel;
}

export interface Intent {
  category: IntentCategory;
  action: string;
  subject: string;
  confidence: number;
}

export interface Sentiment {
  polarity: 'positive' | 'negative' | 'neutral';
  intensity: number;
  emotion?: EmotionType;
}

export interface ContextGaps {
  missingFormat: FormatType[];
  missingDetails: string[];
  ambiguousTerms: string[];
  implicitRequirements: string[];
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  changes: Enhancement[];
  confidence: number;
  processingTime: number;
}

export interface Enhancement {
  type: EnhancementType;
  description: string;
  section: string;
  rationale: string;
}

export interface EnhancementContext {
  userContext?: any;
  chatHistory?: ChatMessage[];
  selectedModel?: string;
  requestHints?: any;
}

export enum IntentCategory {
  INFORMATION_REQUEST = 'information_request',
  TASK_EXECUTION = 'task_execution',
  CREATIVE_WRITING = 'creative_writing',
  CODE_GENERATION = 'code_generation',
  ANALYSIS = 'analysis',
  COMPARISON = 'comparison',
  EXPLANATION = 'explanation',
  TROUBLESHOOTING = 'troubleshooting'
}

export enum PromptType {
  SINGLE_QUESTION = 'single_question',
  MULTI_PART_REQUEST = 'multi_part_request',
  VAGUE_INQUIRY = 'vague_inquiry',
  SPECIFIC_TASK = 'specific_task',
  CONVERSATIONAL = 'conversational'
}

export enum EnhancementType {
  CONTEXT_ADDITION = 'context_addition',
  FORMAT_SPECIFICATION = 'format_specification',
  CLARIFICATION = 'clarification',
  DETAIL_EXPANSION = 'detail_expansion',
  STRUCTURE_IMPROVEMENT = 'structure_improvement'
}

export enum FormatType {
  TABLE = 'table',
  LIST = 'list',
  STEP_BY_STEP = 'step_by_step',
  CODE_BLOCK = 'code_block',
  COMPARISON_CHART = 'comparison_chart',
  EXAMPLE_BASED = 'example_based'
}

export enum VaguenessLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex'
}

export enum EmotionType {
  FRUSTRATED = 'frustrated',
  EXCITED = 'excited',
  CONFUSED = 'confused',
  URGENT = 'urgent',
  CASUAL = 'casual'
}
