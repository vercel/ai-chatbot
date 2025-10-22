export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

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

// CMS types
export type DocStatus = "Live" | "Pending";

export type Doc = {
  id: string;
  title: string;
  source: string;
  updated?: string; // for approved docs
  discovered?: string; // for pending docs
  status: DocStatus;
};

export type AuditItem = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
};

// User management types
export type UserRole = "Admin" | "Editor" | "Viewer";

export type User = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  access: string;
  lastActive: string;
};

// Twins
export type TwinStatus = "active" | "draft" | "placeholder";

export type Twin = {
  id: string;
  name: string;
  status: TwinStatus;
  description?: string;
  createdAt?: string;
};
