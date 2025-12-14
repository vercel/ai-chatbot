import type { UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Tool type definitions (tools are now implemented in Python/FastAPI)
// These types are kept for TypeScript type inference in ChatMessage
// Using z.any() for tool inputs/outputs since tools are handled by backend
const weatherToolInput = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
});

const createDocumentToolInput = z.object({
  title: z.string(),
  kind: z.enum(["text", "code", "image", "sheet"]),
});

const updateDocumentToolInput = z.object({
  id: z.string(),
  description: z.string(),
});

const requestSuggestionsToolInput = z.object({
  documentId: z.string(),
});

// Define tool types that match the structure expected by UIMessage
// These match what InferUITool would generate from the tool definitions
// Tools are now implemented in Python/FastAPI, so output types are any
type weatherTool = {
  input: z.infer<typeof weatherToolInput>;
  output: any; // Weather data structure
};

type createDocumentTool = {
  input: z.infer<typeof createDocumentToolInput>;
  output: any; // Document creation result
};

type updateDocumentTool = {
  input: z.infer<typeof updateDocumentToolInput>;
  output: any; // Document update result
};

type requestSuggestionsTool = {
  input: z.infer<typeof requestSuggestionsToolInput>;
  output: any; // Suggestions result
};

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
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
