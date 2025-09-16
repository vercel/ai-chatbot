import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { tireSearch } from './ai/tools/tires-catalog';
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

type WeatherTool = InferUITool<typeof getWeather>;
type TireTool = InferUITool<typeof tireSearch>;
type CreateDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type UpdateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type RequestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: WeatherTool;
  tireSearch: TireTool;
  createDocument: CreateDocumentTool;
  updateDocument: UpdateDocumentTool;
  requestSuggestions: RequestSuggestionsTool;
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

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
